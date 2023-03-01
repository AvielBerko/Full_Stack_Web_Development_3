/**
 * This file contains a database system. The database system has the
 * following classes:
 * * Database: A database class with all needed tasks (CRUD).
 * * LocalStorageDB: An implementation of database's storage using localStorage.
 *
 * @file database.js
 */

"use strict";


/**
 * LocalStorageDB is a storage implementation for Database class.
 * It implements the get, set, remove functions.
 */
class LocalStorageDB {

    /**
     * Sets an item in the Database.
     * @param id - The item's UUID in the DB.
     * @param value - The item's value.
     */
    setItem(id, value) {
        localStorage.setItem(id, JSON.stringify(value));
    }

    /**
     * Gets an item from the Database.
     * @param id - The item's UUID in the DB.
     */
    getItem(id) {
        const item = localStorage.getItem(id);
        return item ? JSON.parse(item) : null;
    }

    /**
     * Removes an item from the Database.
     * @param id - The item's UUID in the DB.
     */
    removeItem(id) {
        localStorage.removeItem(id);
    }
}

/**
 * Database is a class that handles a single database in a given storage.
 * Every instance of the class needs to be given a name and a storage.
 * The data is saved in tables where each table containt a list of it's items keys.
 * In order to implement this class, one should implement the getItem, setItem and removeItem functions.
 */
class Database {
    /**
     * A local copy of the DB tables to save time accessing the DB many times.
     */
    #dbTables = [];

    /**
     * Database's constractor - sets it's name and storage, and saves a local copy
     * of database's tables.
     * @param storage - The storage used to store the database.
     * @param dbName - The name of the database.
     */
    constructor(storage, dbName) {
        this.storage = storage;
        this.dbName = dbName;
        const dbTables = storage.getItem(dbName);
        if (!dbTables) {
            storage.setItem(dbName, []);
            this.#dbTables = [];
        }
        else {
            this.#dbTables = dbTables;
        }
    }

    /**
     * Checks if a table exists in the database.
     * @param table - The table to check.
     * @returns - True if the table exists in the database, Else otherwise.
     */
    #tableExists(table) {
        return this.#dbTables.includes(table);
    }

    /**
     * Adds a new table to the database. Updates both the database and the local copy.
     * @param table - The table name to add
     */
    addTable(table) {
        if (this.#tableExists(table)) {
            throw Error(`Table ${table} already exists in database`)
        }
        else {
            this.#dbTables.push(table);
            this.storage.setItem(table, []);
            this.storage.setItem(this.dbName, this.#dbTables);
        }
    }

    /**
     * Removes a table and all of it's items from the database.
     * Updates both the database and the local copy.
     * @param table - The table name to remove.
     */
    removeTable(table) {
        if (!this.#tableExists(table)) {
            throw Error(`Table ${table} does not appear in database`)
        }
        const tableContent = this.storage.getItem(table);
        for (let id of tableContent) {
            this.storage.removeItem(id);
        }
        this.storage.removeItem(table);
        this.#dbTables.splice(this.#dbTables.indexOf(table), 1);
        this.storage.setItem(this.dbName, this.#dbTables);
        return true;
    }

    /**
     * Gets an item from the database. If the item doesn't exists throws an error.
     * @param id - The item id (or name if it is a table).
     * @returns - The value of the item from the database.
     */
    get(id) {
        const item = this.storage.getItem(id);
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
    getTableItems(table) {
        let items = [];
        if (this.#tableExists(table)) {
            const itemIDs = this.get(table);
            for (let id of itemIDs) {
                const item = this.get(id);
                items.push({uuid: id, obj: item});
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
    add(item, table, uuid = null) {
        const tableContent = this.get(table)
        const itemID = uuid ?? generateUUID();
        item.table = table;
        tableContent.push(itemID);
        this.storage.setItem(table, tableContent);
        this.storage.setItem(itemID, item);
        return itemID;
    }

    /**
     * Updates an existing item with new value.
     * @param id - The existing item ID.
     * @param item - The new value to assign to the item.
     */
    update(id, item) {
        const oldItem = this.get(id);
        item.table = oldItem.table;
        this.storage.setItem(id, item);
    }

    /**
     * Removes an item from the database (and from the item's table)
     * @param id  - The item's ID.
     * @returns - True if the item was removes successfuly.
     */
    remove(id) {
        const item = this.get(id);
        this.storage.removeItem(id);
        const tableContent = this.get(item.table)
        const filteredItems = tableContent.filter(itemID => itemID !== id);
        this.storage.setItem(item.table, filteredItems);
        return filteredItems.length < tableContent.length;
    }
}
