/**
 * This file contains a fake database system. The database system has the
 * following classes:
 * * Database: An abstract static database class with all needed tasks (CRUD).
 * * LocalStorageDB: An implementation of Database class using localStorage.
 *
 * @file database.js
 */

"use strict";


/**
 * This function generates a uniqe UUID for saving items in the database.
 * @returns Uniqe UUID.
 */
function generateUUID() {
    const data = new Uint32Array(4);
    crypto.getRandomValues(data);
    return `${data[0].toString(16).padStart(8, '0')}-${data[1].toString(16).padStart(4, '0')}-${data[2].toString(16).padStart(4, '0')}-${data[3].toString(16).padStart(4, '0')}-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')}`;
}

/**
 * Database is an abstract static class. 
 * The data is saved in tables where each table containt a list of it's items keys.
 * In order to implement this class, one should implement the getItem, setItem and removeItem functions.
 */
class Database {
    /**
     * A local copy of the DB tables to save time accessing the DB many times.
     */
    static dbTables = [];

    /**
     * This constactor makes the Database class abstract so that no instances can
     * be created.
     */
    constructor() {
        if (this.constructor == Database) {
          throw new Error("Abstract classes can't be instantiated.");
        }
      }

    /**
     * Sets an item in the Database.
     * This is a "pure" virtual function where the implementation is up to the inherited
     * class.
     * @param id - The item's UUID in the DB.
     * @param value - The item's value.
     */
    static setItem(id, value) {
        throw new Error("Method 'setItem()' must be implemented");
    }

    /**
     * Gets an item from the Database.
     * This is a "pure" virtual function where the implementation is up to the inherited
     * class.
     * @param id - The item's UUID in the DB.
     */
    static getItem(id) {
        throw new Error("Method 'getItem()' must be implemented");
    }

    /**
     * Removes an item from the Database.
     * This is a "pure" virtual function where the implementation is up to the inherited
     * class.
     * @param id - The item's UUID in the DB.
     */
    static removeItem(id) {
        throw new Error("Method 'removeItem()' must be implemented");
    }

    /**
     * Checks if a table exists in the database.
     * @param table - The table to check.
     * @returns - True if the table exists in the database, Else otherwise.
     */
    static tableExists(table) {
        return Database.dbTables.includes(table);
    }

    /**
     * Adds a new table to the database. Updates both the database and the local copy.
     * @param table - The table name to add
     */
    static addTable(table) {
        if (this.tableExists(table)) {
            throw Error(`Table ${table} already exists in database`)
        }
        else {
            Database.dbTables.push(table);
            this.setItem(table, []);
            this.setItem('database', Database.dbTables);
        }
    }

    /**
     * Removes a table and all of it's items from the database.
     * Updates both the database and the local copy.
     * @param table - The table name to remove.
     */
    static removeTable(table) {
        if (! this.tableExists(table)) {
            throw Error(`Table ${table} does not appear in database`)
        }
        const tableContent = this.getItem(table);
        for (let id of tableContent) {
            this.removeItem(id);
        }
        this.removeItem(table);
        Database.dbTables.splice(Database.dbTables.indexOf(table), 1);
        this.setItem('database', Database.dbTables);
        return true;
    }

    /**
     * Gets an item from the database. If the item doesn't exists throws an error.
     * @param id - The item id (or name if it is a table).
     * @returns - The value of the item from the database.
     */
    static get(id) {
        const item = this.getItem(id);
        if (!item) {
            throw Error(`${id} does not appear in database`)
        }
        return item;
    }
    
    /**
     * Gets all items in a given table.
     * @param table - The table to get the items from.
     * @returns - A list of all items in the table.
     */
    static getTableValues(table) {
        let items = [];
        if (this.tableExists(table)) {
            const itemIDs = this.get(table);
            for (let id of itemIDs) {
                const item = this.get(id);
                items.push(item);
            }
            return items;
        }
        else {
            throw TypeError(`Table ${table} does not appear in database`)
        }
    }

    /**
     * Adds a given item to a given table.
     * @param item - The item to add.
     * @param table - The table to add the item to.
     * @returns - The uniqe UUID of the new item.
     */
    static add(item, table) {
        const tableContent = this.get(table)
        const itemID = generateUUID();
        item.table = table;
        tableContent.push(itemID);
        this.setItem(table, tableContent);
        this.setItem(itemID, item);
        return itemID;
    }
  
    /**
     * Updates an existing item with new value.
     * @param id - The existing item ID.
     * @param item - The new value to assign to the item.
     */
    static update(id, item) {
        this.get(id);
        this.setItem(id, item);
    }
  
    /**
     * Removes an item from the database (and from the item's table)
     * @param id  - The item's ID.
     * @returns - True if the item was removes successfuly.
     */
    static remove(id) {
        const item = this.get(id);
        this.removeItem(id);
        const tableContent = this.get(item.table)
        const filteredItems = tableContent.filter(itemID => itemID !== id);
        this.setItem(item.table, filteredItems);
        return filteredItems.length < tableContent.length;
    }
}

/**
 * LocalStorageDB is a static implementation of abstract Database class.
 * It copies the database tables from localStorage (or creates it if it doesn't exist).
 * It implements the get, set, remove functions from Database's class.
 */
class LocalStorageDB extends Database {

    /**
     * Dummy constractor, saves a copy of the database tables in a local list.
     */
    static #staticConstructorDummy = (function() {
        const db = localStorage.getItem('database');
        if (!db) {
            localStorage.setItem('database',  JSON.stringify([]));
            Database.dbTables = []
        }
        else {
            Database.dbTables = JSON.parse(db);
        }
      })()

    static setItem(id, value) {
        localStorage.setItem(id, JSON.stringify(value));
    }

    static getItem(id) {
        const item = localStorage.getItem(id);
        return item ? JSON.parse(item) : null;
    }

    static removeItem(id) {
        localStorage.removeItem(id);
    }
}

