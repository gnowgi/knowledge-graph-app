from flask import Flask, jsonify, request
from dotenv import load_dotenv
import sqlite3
import openai
import json

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

    cur.execute("SELECT id FROM pages WHERE LOWER(title) = ?", (normalized_title,))
    if cur.fetchone():
        conn.close()
        return jsonify({"error": "Node with this title already exists."}), 409

    summary = generate_summary(title)
    cur.execute("INSERT INTO pages (title, summary) VALUES (?, ?)", (title, summary))
    page_id = cur.lastrowid
    conn.commit()
    conn.close()

    return jsonify({"id": page_id, "label": title, "summary": summary})


@app.route("/api/nodes", methods=["GET"])
def list_nodes():
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT id, title, summary, is_instance FROM pages")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "label": r[1], "summary": r[2], "is_instance": bool(r[3])} for r in rows])



@app.route("/api/page/<int:page_id>/neighbors")
def neighbors(page_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, title, summary, is_instance FROM pages WHERE id=?", (page_id,))
    node = cur.fetchone()
    nodes = [{"id": node[0], "label": node[1], "summary": node[2], "is_instance": bool(node[3])}] if node else []

    cur.execute("""
        SELECT p.id, p.title, p.summary, p.is_instance, r.source_page_id, r.target_page_id, rt.name
        FROM relations r
        JOIN pages p ON p.id = r.target_page_id
        JOIN relation_types rt ON rt.id = r.relation_type_id
        WHERE r.source_page_id=?
    """, (page_id,))

    links = []
    for nid, title, summary, is_instance, source, target, relname in cur.fetchall():
        nodes.append({"id": nid, "label": title, "summary": summary, "is_instance": bool(is_instance)})
        links.append({"source": source, "target": target, "label": relname})

    conn.close()
    return jsonify({"nodes": nodes, "links": links})


@app.route("/api/node/<int:page_id>", methods=["DELETE"])
def delete_node(page_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    # Check for related links
    cur.execute("SELECT COUNT(*) FROM relations WHERE source_page_id=? OR target_page_id=?", (page_id, page_id))
    relation_count = cur.fetchone()[0]

    if relation_count > 0:
        conn.close()
        return jsonify({
            "success": False,
            "message": f"Node has {relation_count} relation(s). Cannot delete."
        }), 409

    cur.execute("DELETE FROM pages WHERE id=?", (page_id,))
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
    cur.execute("UPDATE pages SET title=?, summary=? WHERE id=?", (title, summary, node_id))
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
        INSERT INTO relations (source_page_id, target_page_id, relation_type_id, modality, subject_quantifier, object_quantifier)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (source, target, relation_type_id, modality, subject_quantifier, object_quantifier))

    # Normalize and check for 'instance of' relation
    if normalize_relation_name(rel_name) == "instance of":
        cur.execute("UPDATE pages SET is_instance=1 WHERE id=?", (source,))

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
        JOIN pages s ON r.source_page_id = s.id
        JOIN pages t ON r.target_page_id = t.id
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


if __name__ == "__main__":
    app.run(debug=True)
