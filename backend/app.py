from flask import Flask, jsonify, request
from dotenv import load_dotenv
import sqlite3
import openai

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
    cur.execute("SELECT id, title, summary FROM pages")
    rows = cur.fetchall()
    conn.close()
    return jsonify([{"id": r[0], "label": r[1], "summary": r[2]} for r in rows])



@app.route("/api/page/<int:page_id>/neighbors")
def neighbors(page_id):
    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    cur.execute("SELECT id, title, summary FROM pages WHERE id=?", (page_id,))
    node = cur.fetchone()
    nodes = [{"id": node[0], "label": node[1], "summary": node[2]}] if node else []

    cur.execute("""
        SELECT p.id, p.title, p.summary, r.source_page_id, r.target_page_id, rt.name
        FROM relations r
        JOIN pages p ON p.id = r.target_page_id
        JOIN relation_types rt ON rt.id = r.relation_type_id
        WHERE r.source_page_id=?
    """, (page_id,))

    links = []
    for nid, title, summary, source, target, relname in cur.fetchall():
        nodes.append({"id": nid, "label": title, "summary": summary})
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

@app.route("/api/relation/create", methods=["POST"])
def create_relation():
    data = request.get_json()
    source = data["source"]
    target = data["target"]
    relation_type_id = data["relation_id"]

    conn = sqlite3.connect(config.DB_PATH)
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO relations (source_page_id, target_page_id, relation_type_id)
        VALUES (?, ?, ?)
    """, (source, target, relation_type_id))

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
        SELECT r.id, s.title, rt.name, t.title
        FROM relations r
        JOIN pages s ON r.source_page_id = s.id
        JOIN pages t ON r.target_page_id = t.id
        JOIN relation_types rt ON r.relation_type_id = rt.id
    """)
    rows = cur.fetchall()
    conn.close()
    return jsonify([
        {"id": r[0], "source_label": r[1], "label": r[2], "target_label": r[3]}
        for r in rows
    ])


if __name__ == "__main__":
    app.run(debug=True)
