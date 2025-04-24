PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE pages (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    summary TEXT		
);
INSERT INTO pages VALUES(2,'Biology',NULL);
INSERT INTO pages VALUES(3,'Life Sciences',NULL);
INSERT INTO pages VALUES(4,'Cell','Cells are the basic units of life that make up all living organisms and perform various functions to keep the organism alive.');
INSERT INTO pages VALUES(5,'Living Organism','A living organism is a single entity that can grow, reproduce, respond to stimuli, and maintain homeostasis.');
INSERT INTO pages VALUES(7,'Area of Study','Area of study refers to the specific subject or discipline that you focus on in your academic pursuits, such as biology, history, or psychology.');
INSERT INTO pages VALUES(8,'Physics','Physics is the study of matter, energy, and the interactions between them.');
INSERT INTO pages VALUES(9,'physical interactions','Physical interactions are the forces and movements that occur between objects or living things when they come into contact with each other.');
INSERT INTO pages VALUES(10,'matter','Matter is anything that has mass and takes up space in the universe.');
INSERT INTO pages VALUES(11,'Newton','Isaac Newton was a famous scientist who discovered gravity and the laws of motion.');
INSERT INTO pages VALUES(12,'Scientist','A scientist is a person who uses investigation and experimentation to study and understand the natural world.');
INSERT INTO pages VALUES(13,'gravity','Gravity is the force that pulls objects towards each other, like how the Earth pulls everything towards its center.');
INSERT INTO pages VALUES(14,'the laws of motion','The laws of motion, created by Sir Isaac Newton, explain how objects move and interact with one another based on three principles: an object will remain at rest or in constant motion unless acted upon by an external force, the force acting on an object is equal to its mass multiplied by its acceleration, and for every action there is an equal and opposite reaction.');
CREATE TABLE relation_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    inverse_name TEXT,
    is_symmetric INTEGER DEFAULT 0,
    is_transitive INTEGER DEFAULT 0
);
INSERT INTO relation_types VALUES(1,'is part of','has part',0,1);
INSERT INTO relation_types VALUES(2,'is unit of','has unit',0,0);
INSERT INTO relation_types VALUES(3,'same as','same as',1,0);
INSERT INTO relation_types VALUES(4,'is a','includes',0,1);
INSERT INTO relation_types VALUES(5,'is a member of','has member',0,0);
INSERT INTO relation_types VALUES(6,'is study of','studied in',0,0);
INSERT INTO relation_types VALUES(7,'discovered','discovered by',0,0);
CREATE TABLE relations (
    id INTEGER PRIMARY KEY,
    source_page_id INTEGER NOT NULL,
    target_page_id INTEGER NOT NULL,
    relation_type_id INTEGER NOT NULL,
    FOREIGN KEY(source_page_id) REFERENCES pages(id),
    FOREIGN KEY(target_page_id) REFERENCES pages(id),
    FOREIGN KEY(relation_type_id) REFERENCES relation_types(id)
);
INSERT INTO relations VALUES(3,4,5,2);
INSERT INTO relations VALUES(4,2,3,3);
INSERT INTO relations VALUES(5,2,7,4);
INSERT INTO relations VALUES(6,8,7,4);
INSERT INTO relations VALUES(7,8,9,6);
INSERT INTO relations VALUES(8,8,10,6);
INSERT INTO relations VALUES(9,3,7,4);
INSERT INTO relations VALUES(10,11,12,5);
INSERT INTO relations VALUES(11,11,13,7);
INSERT INTO relations VALUES(12,11,14,7);
CREATE TABLE attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    data_type TEXT NOT NULL, -- e.g. integer, float, string, boolean, date, array
    allowed_values TEXT,     -- comma-separated or JSON string for enums
    unit TEXT
);
CREATE TABLE node_attributes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    node_id INTEGER NOT NULL,         -- references pages(id)
    attribute_id INTEGER NOT NULL,    -- references attributes(id)
    value TEXT,                       -- store as string, cast as needed
    FOREIGN KEY(node_id) REFERENCES pages(id),
    FOREIGN KEY(attribute_id) REFERENCES attributes(id)
);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('relation_types',7);
COMMIT;
