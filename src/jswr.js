"use strict";

export default useSWR;
export { Jswr, JswrCache };

class JswrCacheItem {
    constructor(value, expires = 0, stales = 0) {
        this.value = value;
        this.expires = expires;
        this.stales = stales;
    }

    get expired() {
        return this.expires && Date.now() > this.expires;
    }

    get stale() {
        return this.stales && Date.now() > this.stales;
    }
}

class JswrCache {
    constructor() {}
    get(key) {}
    set(key, value) {}
    remove(key) {}
}

class JswrInMemoryCache extends JswrCache {
    constructor() {
        super();
        this.cache = {};
    }

    get(key) {
        return this.cache[key];
    }
    set(key, value) {
        this.cache[key] = value;
    }
    remove(key) {
        delete this.cache[key];
    }
}

function fetchXMLHttpRequest(url) {
    return new Promise((resolve, reject) => {
        try {
            const request = new XMLHttpRequest();

            request.open("GET", url, false);
            request.timeout = 8000;

            request.send();

            if (
                request.readyState != XMLHttpRequest.DONE &&
                request.readyState != 4
            ) {
                reject("Unable to complete HTTP request.");
            }

            if (request.status < 200 || request.status > 299) {
                reject({
                    statusCode: request.status,
                    respose: request.response,
                });
            }

            resolve(request.response);
        } catch (error) {
            reject(error);
        }
    });
}

class Jswr {
    constructor(fetcher = fetchXMLHttpRequest, options) {
        this.fetcher = fetcher;
        const cache = new JswrInMemoryCache();
        this.options = {
            maxAge: 2,
            maxStale: 10,
            // minFresh: 0,
            // noCache: false,
            // noStore: false,
            // noTransform: false,
            // onlyIfCached: false,
            cache,
            ...options,
        };
    }

    useSWR(key, fetcher = this.fetcher, options) {
        options = { ...this.options, ...options };
        return useSWR(key, fetcher, options);
    }
}

export const jswrConfig = new Jswr();

function useSWR(key, fetcher = jswrConfig.fetcher, options) {
    options = { ...options, ...jswrConfig.options };

    const result = {
        data: undefined,
        error: undefined,
        isValidating: true,
        // mutate,
    };
    let expired = true;
    let stale = true;

    let cachedItem = options.cache.get(key);
    if (cachedItem) {
        expired = cachedItem.expired;
        stale = cachedItem.stale;

        if (expired) {
            options.cache.remove(key);
        } else {
            result.data = cachedItem.value;
        }
    }

    if (expired || stale) {
        fetchAndCache(key, result, fetcher, options);
    } else {
        result.isValidating = false;
    }

    return result;
}

function fetchAndCache(key, result, fetcher, options) {
    const fetchPromise = fetcher(key);

    fetchPromise.then((data) => {
        result.data = data;
    });

    fetchPromise.then((data) => {
        cashData(key, data, options);
    });

    fetchPromise.catch((error) => {
        result.error = error;
    });

    fetchPromise.finally(() => {
        result.isValidating = false;
    });
}

function cashData(key, data, options) {
    const now = Date.now();
    options.cache.set(
        key,
        new JswrCacheItem(
            data,
            now + (options.maxAge + options.maxStale) * 1000,
            now + options.maxAge * 1000
        )
    );

    setTimeout(() => {
        var cachedItem = options.cache.get(key);
        if (cachedItem.expired) {
            options.cache.remove(key);
        }
    }, (options.maxAge + options.maxStale) * 1000);
}
