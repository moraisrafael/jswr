export default useSWR;
export { Jswr, JswrCache };

class JswrCacheItem {
    expires = 0;
    stales = 0;
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

class JswrInMemoryCache extends JswrCache {
    cache = {};
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

class JswrCache {
    get(key) {}
    set(key, value) {}
    remove(key) {}
}

class Jswr {
    constructor(fetcher = Jswr.globalFetcher, options) {
        this.fetcher = fetcher;
        this.options = { ...globalOptions, ...options };
    }

    static globalFetcher = fetch;

    static globalOptions = {
        maxAge: 2,
        maxStale: 10,
        // minFresh: 0,
        // noCache: false,
        // noStore: false,
        // noTransform: false,
        // onlyIfCached: false,
        cache: new JswrInMemoryCache(),
    };

    useSWR(key, fetcher = this.fetcher, options) {
        options = { ...this.options, ...options };
        return useSWR(key, fetcher, options);
    }
}

function useSWR(key, fetcher = Jswr.globalFetcher, options) {
    const result = {
        data: undefined,
        error: undefined,
        isValidating: true,
        // mutate,
    };
    options = { ...options, ...Jswr.globalOptions };
    let expired = true;
    let stale = true;

    let cachedItem = options.cache.get(key);
    if (cachedItem) {
        expired = cachedItem.expired;
        stale = cachedItem.stale;

        if (expired) {
            options.cache.remove(key);
        }
        else {
            result.data = cachedItem.value;
        }
    }

    if (expired || stale) {
        fetchAndCache(key, result, fetcher, options)
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
