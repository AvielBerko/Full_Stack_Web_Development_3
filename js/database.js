class Database {

    static #staticConstructorDummy = (function() {
        const database = localStorage.getItem('Database');
        if (!database) {
            localStorage.setItem('Database',  JSON.stringify([]));
        }
      })()

    static getAllKeys() {
        const database_keys = localStorage.getItem('Database');
        return database_keys ? JSON.parse(database_keys) : [];
    }

    static addKey(key) {
        const allKeys = this.getAllKeys();
        if (allKeys.includes(key)) {
            throw TypeError(`Key ${key} already exists in database`)
        }
        else {
            allKeys.push(key)
            localStorage.setItem('Database', JSON.stringify(allKeys))
            localStorage.setItem(key, JSON.stringify([]))
        }
    }

    static removeKey(key) {
        const allKeys = this.getAllKeys();
        if (!allKeys.includes(key)) {
            throw TypeError(`Key ${key} does not exist in database`)
        }
        else {
            const allItems = this.getAll(key);
            for (let id of allItems) {
                this.remove(id);
            }
            localStorage.removeItem(key);
            const filteredKeys = allKeys.filter(curKey => curKey !== key);
            localStorage.setItem('Database', JSON.stringify(filteredKeys));
            return filteredKeys.length < allKeys.length;
        }
    }

    static add(item, key) {
        const items = this.getAll(key);
        const itemID = this.generateUUID();
        item.key = key;
        items.push(itemID);
        localStorage.setItem(item.key, JSON.stringify(items));
        localStorage.setItem(itemID, JSON.stringify(item))
        return itemID;
    }
  
    static update(id, item) {
        this.get(id);
        localStorage.setItem(id, JSON.stringify(item));
    }
  
    static remove(id) {
        const item = this.get(id);
        const allItems = this.getAll(item.key)
        const filteredItems = allItems.filter(itemID => itemID !== id);
        localStorage.setItem(item.key, JSON.stringify(filteredItems));
        localStorage.removeItem(id);
        return filteredItems.length < allItems.length;
    }
  
    static getAll(key) {
        if (this.getAllKeys().includes(key)) {
            const allItems = localStorage.getItem(key)
            return allItems ? JSON.parse(allItems) : [];
        }
        else {
            throw TypeError(`Key ${key} data does not appear in database`)
        }
    }
  
    static get(id) {
        const item = localStorage.getItem(id);
        if (!item) {
            throw TypeError(`ID ${id} does not appear in database`)
        }
        return JSON.parse(item);
    }

    static generateUUID() {
        const data = new Uint32Array(4);
        crypto.getRandomValues(data);
        return `${data[0].toString(16).padStart(8, '0')}-${data[1].toString(16).padStart(4, '0')}-${data[2].toString(16).padStart(4, '0')}-${data[3].toString(16).padStart(4, '0')}-${Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0')}`;
    }
}
