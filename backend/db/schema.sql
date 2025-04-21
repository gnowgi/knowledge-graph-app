-- Pages (Nodes)
CREATE TABLE pages (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT		
);

-- Relation Types (Semantics)
CREATE TABLE relation_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    inverse_name TEXT,
    is_symmetric INTEGER DEFAULT 0,
    is_transitive INTEGER DEFAULT 0
);

-- Relations (Edges)
CREATE TABLE relations (
    id INTEGER PRIMARY KEY,
    source_page_id INTEGER NOT NULL,
    target_page_id INTEGER NOT NULL,
    relation_type_id INTEGER NOT NULL,
    FOREIGN KEY(source_page_id) REFERENCES pages(id),
    FOREIGN KEY(target_page_id) REFERENCES pages(id),
    FOREIGN KEY(relation_type_id) REFERENCES relation_types(id)
);

-- Sample data
INSERT INTO pages (id, title) VALUES (1, 'Photosynthesis'), (2, 'Biology'), (3, 'Life Sciences');
INSERT INTO relation_types (id, name, is_symmetric, is_transitive) VALUES (1, 'is part of', 0, 1);
INSERT INTO relations (source_page_id, target_page_id, relation_type_id) VALUES
    (1, 2, 1),
    (2, 3, 1);
