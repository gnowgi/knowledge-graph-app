from flask import Flask, jsonify, request, g
from dotenv import load_dotenv
from markupsafe import escape
import sqlite3
import openai
import json
import spacy

nlp = spacy.load("en_core_web_sm")

load_dotenv()
import config

app = Flask(__name__)
openai.api_key = config.OPENAI_API_KEY  
DB_PATH=config.DB_PATH


@app.route("/api/node/create", methods=["POST"])
def create_node():
    data = request.get_json()
    title = data["title"].strip()
    normalized_title = title.lower()

    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id FROM nodes WHERE LOWER(title) = ?", (normalized_title,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Node with this title already exists."}), 409

    summary = generate_summary(title)
    cur.execute("INSERT INTO nodes (title, summary) VALUES (?, ?)", (title, summary))
    node_id = cur.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"id": node_id, "label": title, "summary": summary})


@app.route("/api/nodes", methods=["GET"])
def list_nodes():
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title, summary, is_instance FROM nodes")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "label": r[1], "summary": r[2], "is_instance": bool(r[3])} for r in rows])



@app.route("/api/node/<int:node_id>/neighbors")
def neighbors(node_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, title, summary, is_instance FROM nodes WHERE id=?", (node_id,))
    node = cur.fetchone()
    nodes = [{"id": node[0], "label": node[1], "summary": node[2], "is_instance": bool(node[3])}] if node else []

    cur.execute("""
        SELECT n.id, n.title, n.summary, n.is_instance, r.source_node_id, r.target_node_id, rt.name
        FROM relations r
        JOIN nodes n ON n.id = r.target_node_id
        JOIN relation_types rt ON rt.id = r.relation_type_id
        WHERE r.source_node_id=?
    """, (node_id,))

    links = []
    for nid, title, summary, is_instance, source, target, relname in cur.fetchall():
        nodes.append({"id": nid, "label": title, "summary": summary, "is_instance": bool(is_instance)})
        links.append({"source": source, "target": target, "label": relname})

    conn.close()
    return jsonify({"nodes": nodes, "links": links})


@app.route("/api/node/<int:node_id>", methods=["DELETE"])
def delete_node(node_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    # Check for related links
    cur.execute("SELECT COUNT(*) FROM relations WHERE source_node_id=? OR target_node_id=?", (node_id, node_id))
    relation_count = cur.fetchone()[0]

    if relation_count > 0:
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Node has {relation_count} relation(s). Cannot delete."
        }), 409

    cur.execute("DELETE FROM nodes WHERE id=?", (node_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/node/update", methods=["POST"])
def update_node():
    data = request.get_json()
    node_id = data["id"]
    title = data.get("title", "")
    summary = data.get("summary", "")

    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("UPDATE nodes SET title=?, summary=? WHERE id=?", (title, summary, node_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True})


def generate_summary(title):
    from openai import OpenAI

    client = OpenAI(api_key=config.OPENAI_API_KEY)

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": f"Give a one-sentence explanation of '{title}' suitable for students."}
        ]
    )

    return response.choices[0].message.content.strip()

@app.route("/api/relation-type", methods=["POST"])
def create_relation_type():
    data = request.get_json()
    name = data.get("name", "").strip()
    is_symmetric = int(data.get("symmetric", False))
    is_transitive = int(data.get("transitive", False))
    inverse_name = data.get("inverse_name", "").strip()

    if not name:
        return jsonify({"error": "Relation name is required"}), 400

    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    # Check for existing relation type (case-insensitive)
    cur.execute("SELECT id FROM relation_types WHERE LOWER(name)=?", (name.lower(),))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Relation type already exists"}), 409

    cur.execute("""
    INSERT INTO relation_types (name, inverse_name, is_symmetric, is_transitive)
    VALUES (?, ?, ?, ?)
    """, (name, inverse_name, is_symmetric, is_transitive))

    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/relation-type/<int:type_id>", methods=["PATCH"])
def update_relation_type(type_id):
    data = request.get_json()
    name = data.get("name", "").strip()
    is_symmetric = int(data.get("symmetric", False))
    is_transitive = int(data.get("transitive", False))
    inverse_name = data.get("inverse_name", "").strip()

    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    cur.execute("""
    UPDATE relation_types
    SET name=?, inverse_name=?, is_symmetric=?, is_transitive=?
    WHERE id=?
    """, (name, inverse_name, is_symmetric, is_transitive, type_id))

    
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/relation-types", methods=["GET"])
def list_relation_types():
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, name, inverse_name, is_symmetric, is_transitive FROM relation_types")
    rows = cur.fetchall()
    conn.close()
    return jsonify([
    {
        "id": r[0], "name": r[1], "inverse_name": r[2],
        "symmetric": bool(r[3]), "transitive": bool(r[4])
    }
    for r in rows
])



# @app.route("/api/relation/create", methods=["POST"])
# def create_relation():
#     data = request.get_json()
#     source = data["source"]
#     target = data["target"]
#     relation_name = data["relation"].strip()
#     is_symmetric = int(data.get("symmetric", False))
#     is_transitive = int(data.get("transitive", False))

#     conn = sqlite3.connect(config.DB_PATH)
#     cur = conn.cursor()

#     # Check if this relation_type already exists
#     cur.execute("SELECT id FROM relation_types WHERE name=?", (relation_name,))
#     row = cur.fetchone()

#     if row:
#         relation_type_id = row[0]
#     else:
#         cur.execute(
#             "INSERT INTO relation_types (name, is_symmetric, is_transitive) VALUES (?, ?, ?)",
#             (relation_name, is_symmetric, is_transitive)
#         )
#         relation_type_id = cur.lastrowid

#     # Insert the relation
#     cur.execute(
#         "INSERT INTO relations (source_page_id, target_page_id, relation_type_id) VALUES (?, ?, ?)",
#         (source, target, relation_type_id)
#     )

#     conn.commit()
#     conn.close()

#     return jsonify({"success": True})

def normalize_relation_name(name):
    stopwords = {"is", "an", "a", "the"}
    tokens = [w for w in name.lower().split() if w not in stopwords]
    return " ".join(tokens)

@app.route("/api/relation/create", methods=["POST"])
def create_relation():
    data = request.get_json()
    source = data["source"]
    target = data["target"]
    relation_type_id = data["relation_id"]
    modality = data.get("modality")
    subject_quantifier = data.get("subject_quantifier")
    object_quantifier = data.get("object_quantifier")

    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    # Get the relation type name
    cur.execute("SELECT name FROM relation_types WHERE id=?", (relation_type_id,))
    row = cur.fetchone()
    rel_name = row[0] if row else ""

    # Insert the relation with new fields
    cur.execute("""
        INSERT INTO relations (source_node_id, target_node_id, relation_type_id, modality, subject_quantifier, object_quantifier)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (source, target, relation_type_id, modality, subject_quantifier, object_quantifier))

    # Normalize and check for 'instance of' relation
    if normalize_relation_name(rel_name) == "instance of":
        cur.execute("UPDATE nodes SET is_instance=1 WHERE id=?", (source,))

    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/relation/<int:relation_id>", methods=["DELETE"])
def delete_relation(relation_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM relations WHERE id=?", (relation_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/relations", methods=["GET"])
def list_relations():
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("""
        SELECT r.id, s.title, rt.name, t.title, r.modality, r.subject_quantifier, r.object_quantifier
        FROM relations r
        JOIN nodes s ON r.source_node_id = s.id
        JOIN nodes t ON r.target_node_id = t.id
        JOIN relation_types rt ON r.relation_type_id = rt.id
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {"id": r[0], "source_label": r[1], "label": r[2], "target_label": r[3], "modality": r[4], "subject_quantifier": r[5], "object_quantifier": r[6]}
        for r in rows
    ])

@app.route("/api/attributes", methods=["GET"])
def list_attributes():
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, name, description, data_type, allowed_values, unit, applicable_nodes FROM attributes")
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {
            "id": r[0],
            "name": r[1],
            "description": r[2],
            "data_type": r[3],
            "allowed_values": r[4],
            "unit": r[5],
            "applicable_nodes": json.loads(r[6]) if r[6] else []
        } for r in rows
    ])

@app.route("/api/attribute", methods=["POST"])
def create_attribute():
    data = request.get_json()
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    data_type = data.get("data_type", "").strip()
    allowed_values = data.get("allowed_values", "").strip()
    unit = data.get("unit", "").strip()
    applicable_nodes = data.get("applicable_nodes", [])
    if not name or not data_type:
        return jsonify({"error": "Name and data_type are required."}), 400
    # Ensure applicable_nodes is a list, then store as JSON string
    if not isinstance(applicable_nodes, list):
        applicable_nodes = []
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO attributes (name, description, data_type, allowed_values, unit, applicable_nodes) VALUES (?, ?, ?, ?, ?, ?)",
            (name, description, data_type, allowed_values, unit, json.dumps(applicable_nodes))
        )
        conn.commit()
        attr_id = cur.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Attribute with this name already exists."}), 409
    conn.close()
    return jsonify({
        "id": attr_id,
        "name": name,
        "description": description,
        "data_type": data_type,
        "allowed_values": allowed_values,
        "unit": unit,
        "applicable_nodes": applicable_nodes
    })

@app.route("/api/attribute/<int:attr_id>", methods=["PATCH"])
def update_attribute(attr_id):
    data = request.get_json()
    name = data.get("name", "").strip()
    description = data.get("description", "").strip()
    data_type = data.get("data_type", "").strip()
    allowed_values = data.get("allowed_values", "").strip()
    unit = data.get("unit", "").strip()
    applicable_nodes = data.get("applicable_nodes", [])
    # Ensure applicable_nodes is a list, then store as JSON string
    if not isinstance(applicable_nodes, list):
        applicable_nodes = []
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute(
        "UPDATE attributes SET name=?, description=?, data_type=?, allowed_values=?, unit=?, applicable_nodes=? WHERE id=?",
        (name, description, data_type, allowed_values, unit, json.dumps(applicable_nodes), attr_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/attribute/<int:attr_id>", methods=["DELETE"])
def delete_attribute(attr_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM attributes WHERE id=?", (attr_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/node/<int:node_id>/attributes", methods=["GET"])
def get_node_attributes(node_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute('''
        SELECT na.id, na.attribute_id, a.name, a.description, a.data_type, a.allowed_values, a.unit, na.value, na.quantifier
        FROM node_attributes na
        JOIN attributes a ON na.attribute_id = a.id
        WHERE na.node_id = ?
    ''', (node_id,))
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {
            "id": r[0],
            "attribute_id": r[1],
            "name": r[2],
            "description": r[3],
            "data_type": r[4],
            "allowed_values": r[5],
            "unit": r[6],
            "value": r[7],
            "quantifier": r[8]
        } for r in rows
    ])

def validate_attribute_value(data_type, value, allowed_values=None):
    if data_type == "integer":
        try:
            int(value)
            return True
        except Exception:
            return False
    elif data_type == "float":
        try:
            float(value)
            return True
        except Exception:
            return False
    elif data_type == "boolean":
        return str(value).lower() in ("true", "false", "1", "0")
    elif data_type == "date":
        import re
        return bool(re.match(r"^\d{4}-\d{2}-\d{2}$", str(value)))
    elif data_type == "array":
        return isinstance(value, str) and len(value.strip()) > 0
    elif data_type == "string":
        return isinstance(value, str)
    if allowed_values:
        allowed = [v.strip() for v in allowed_values.split(";") if v.strip()]
        return value in allowed
    return True

@app.route("/api/node/<int:node_id>/attribute", methods=["POST"])
def add_node_attribute(node_id):
    data = request.get_json()
    attribute_id = data.get("attribute_id")
    value = data.get("value", "")
    quantifier = data.get("quantifier", None)
    if not attribute_id:
        return jsonify({"error": "attribute_id is required."}), 400

    # Fetch attribute metadata for validation
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT data_type, allowed_values FROM attributes WHERE id=?", (attribute_id,))
    attr_row = cur.fetchone()
    if not attr_row:
        conn.close()
        return jsonify({"error": "Attribute not found."}), 404
    data_type, allowed_values = attr_row

    if not validate_attribute_value(data_type, value, allowed_values):
        conn.close()
        return jsonify({"error": f"Invalid value for data_type '{data_type}'."}), 400

    cur.execute(
        "INSERT INTO node_attributes (node_id, attribute_id, value, quantifier) VALUES (?, ?, ?, ?)",
        (node_id, attribute_id, value, quantifier)
    )
    conn.commit()
    na_id = cur.lastrowid
    conn.close()
    return jsonify({"id": na_id, "node_id": node_id, "attribute_id": attribute_id, "value": value, "quantifier": quantifier})

@app.route("/api/node_attribute/<int:na_id>", methods=["PATCH"])
def update_node_attribute(na_id):
    data = request.get_json()
    value = data.get("value", "")
    quantifier = data.get("quantifier", None)
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    # Fetch attribute_id and data_type for validation
    cur.execute("SELECT attribute_id FROM node_attributes WHERE id=?", (na_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return jsonify({"error": "Node attribute not found."}), 404
    attribute_id = row[0]
    cur.execute("SELECT data_type, allowed_values FROM attributes WHERE id=?", (attribute_id,))
    attr_row = cur.fetchone()
    if not attr_row:
        conn.close()
        return jsonify({"error": "Attribute not found."}), 404
    data_type, allowed_values = attr_row

    if not validate_attribute_value(data_type, value, allowed_values):
        conn.close()
        return jsonify({"error": f"Invalid value for data_type '{data_type}'."}), 400

    if quantifier is not None:
        cur.execute("UPDATE node_attributes SET value=?, quantifier=? WHERE id=?", (value, quantifier, na_id))
    else:
        cur.execute("UPDATE node_attributes SET value=? WHERE id=?", (value, na_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

@app.route("/api/node_attribute/<int:na_id>", methods=["DELETE"])
def delete_node_attribute(na_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM node_attributes WHERE id=?", (na_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# Handles GET /api/nodes/<node_id>/possible-attributes
@app.route('/api/nodes/<int:node_id>/possible-attributes', methods=['GET'])
def get_possible_attributes(node_id):
    db = get_db()
    direct = db.execute(
        '''
        SELECT a.* FROM attributes a
        JOIN possible_node_attributes pna ON a.id = pna.attribute_id
        WHERE pna.node_id = ?
        ''',
        (node_id,)
    ).fetchall()

    # Fix: inherited attributes should come from parent (target_node_id) of "is_a" relation
    inherited = db.execute(
        '''
        SELECT DISTINCT a.* FROM attributes a
        JOIN possible_node_attributes pna ON a.id = pna.attribute_id
        JOIN relations r ON r.target_node_id = pna.node_id
        WHERE r.source_node_id = ? AND r.relation_type_id = (
            SELECT id FROM relation_types WHERE name = 'is_a' OR name = 'is a' LIMIT 1
        )
        ''',
        (node_id,)
    ).fetchall()

    return jsonify({
        'direct': [dict(row) for row in direct],
        'inherited': [dict(row) for row in inherited]
    })

# Handles POST /api/nodes/<node_id>/possible-attributes
@app.route('/api/nodes/<int:node_id>/possible-attributes', methods=['POST'])
def assign_possible_attributes(node_id):
    data = request.get_json()
    attribute_ids = data.get('attribute_ids', [])
    
    db = get_db()
    for attr_id in attribute_ids:
        try:
            db.execute(
                'INSERT OR IGNORE INTO possible_node_attributes (node_id, attribute_id) VALUES (?, ?)',
                (node_id, attr_id)
            )
        except Exception as e:
            print(f"Error assigning attribute {attr_id}: {e}")
            continue
    db.commit()
    return jsonify({'status': 'success', 'assigned': attribute_ids})

# Handles DELETE /api/nodes/<node_id>/possible-attributes/<attribute_id>
@app.route('/api/nodes/<int:node_id>/possible-attributes/<int:attribute_id>', methods=['DELETE'])
def delete_possible_attribute(node_id, attribute_id):
    # ...existing code...
    return jsonify({'status': 'deleted', 'node_id': node_id, 'attribute_id': attribute_id})

@app.route("/api/node/<int:node_id>", methods=["GET"])
def get_node(node_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title, summary, is_instance FROM nodes WHERE id=?", (node_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return jsonify({"error": "Node not found"}), 404
    return jsonify({"id": row[0], "label": row[1], "summary": row[2], "is_instance": bool(row[3])})

def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(config.DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db

@app.teardown_appcontext
def close_db(exception):
    db = g.pop('db', None)
    if db is not None:
        db.close()

@app.route("/api/relation-type/<int:type_id>", methods=["DELETE"])
def delete_relation_type(type_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    # Check if any relations use this relation type
    cur.execute("SELECT COUNT(*) FROM relations WHERE relation_type_id=?", (type_id,))
    count = cur.fetchone()[0]
    if count > 0:
        conn.close()
        return jsonify({"success": False, "message": "Cannot delete: relation type is in use."}), 409
    cur.execute("DELETE FROM relation_types WHERE id=?", (type_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


# NLP Support functions

def parse_summary_text(text):
    doc = nlp(text)
    relations = []
    attributes = []
    debug_tokens = []

    for sent in doc.sents:
        for token in sent:
            # Save all tokens for inspection
            debug_tokens.append({
                "text": token.text,
                "lemma": token.lemma_,
                "pos": token.pos_,
                "tag": token.tag_,
                "dep": token.dep_,
                "head": token.head.text
            })

            # RELATIONS: subject-verb-object
            if token.dep_ == "ROOT" and token.pos_ == "VERB":
                subj = [w for w in token.lefts if w.dep_ in ("nsubj", "nsubjpass")]
                obj = [w for w in token.rights if w.dep_ in ("dobj", "attr", "prep", "pobj", "xcomp", "acomp")]
                for s in subj:
                    for o in obj:
                        relations.append({
                            "subject": s.text,
                            "predicate": token.lemma_,
                            "object": o.text
                        })

            # RELATIONS: copula ("X is a Y")
            if token.dep_ == "attr" and token.head.pos_ == "AUX":
                subj = [w for w in token.head.lefts if w.dep_ == "nsubj"]
                if subj:
                    relations.append({
                        "subject": subj[0].text,
                        "predicate": token.head.lemma_,
                        "object": token.text
                    })

            # RELATIONS: relative clauses ("who developed...")
            if token.dep_ == "relcl" and token.head.pos_ in ("NOUN", "PROPN"):
                subj = token.head.text
                obj = [w for w in token.rights if w.dep_ in ("dobj", "pobj", "xcomp")]
                for o in obj:
                    relations.append({
                        "subject": subj,
                        "predicate": token.lemma_,
                        "object": o.text
                    })

            # ATTRIBUTES: adjective modifiers or compound descriptors
            if token.pos_ == "NOUN":
                for child in token.children:
                    if child.dep_ in ("amod", "compound"):
                        attributes.append({
                            "entity": token.text,
                            "attribute": child.text
                        })

    return {
        "common_nouns": list({t.text for t in doc if t.pos_ == "NOUN" and t.ent_type_ == ""}),
        "proper_nouns": list({t.text for t in doc if t.pos_ == "PROPN"}),
        "relations": relations,
        "attributes": attributes,
        "prepositions": [t.text for t in doc if t.pos_ == "ADP"],
        "logical_connectives": [t.text for t in doc if t.pos_ == "CCONJ"],
        "debug_tokens": debug_tokens,  # for inspection
        "highlighted_summary": highlight_text(doc, relations, attributes)
    }


from markupsafe import escape

def highlight_text(doc, relations, attributes):
    relation_verbs = {r["predicate"] for r in relations}
    attribute_words = {a["attribute"].lower() for a in attributes}

    noun_chunks = list(doc.noun_chunks)
    chunk_starts = {chunk.start for chunk in noun_chunks}
    highlighted = []
    i = 0

    while i < len(doc):
        token = doc[i]

        # If token starts a noun chunk
        if i in chunk_starts:
            chunk = next(c for c in noun_chunks if c.start == i)
            span_tokens = []
            for tok in chunk:
                if tok.pos_ == "DET":
                    span_tokens.append(escape(tok.text) + tok.whitespace_)
                else:
                    span_tokens.append(f"<strong>{escape(tok.text)}</strong>" + tok.whitespace_)
            highlighted.append("".join(span_tokens))
            i = chunk.end
            continue

        # Otherwise apply additional styling
        word = escape(token.text)
        styles = []

        if token.pos_ == "PROPN":
            styles.append("font-weight:bold; color:blue")
        if token.lemma_ in relation_verbs and token.pos_ == "VERB":
            styles.append("font-style:italic")
        if token.text.lower() in attribute_words:
            styles.append("color:gray")
        if token.pos_ == "ADP":
            styles.append("color:blue")

        if styles:
            word = f"<span style=\"{' '.join(styles)}\">{word}</span>"

        highlighted.append(word + token.whitespace_)
        i += 1

    return "".join(highlighted)




@app.route("/api/nlp/parse-summary", methods=["POST"])
def parse_summary():
    data = request.get_json()
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "No summary text provided."}), 400

    result = parse_summary_text(text)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True)
