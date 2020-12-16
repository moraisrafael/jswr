# jswr
jswr is a data fetching library, that uses stale-while-revalidate invalidation strategy
It is meant to use vercel's swr return, with http cache-control as option parameters

Usage
npm install jswr

import useSWR from "jswr"

const { data, error, isValidating } = useSWR(key, fetcher, options)

Parameters:
key: a unique key string for the request (or a function / array / null) (advanced usage).
fetcher: (optional) a Promise returning function to fetch your data (details).
options: (optional) an object of options.

Return Values:
data: data for the given key resolved by fetcher (or undefined if not loaded).
error: error thrown by fetcher (or undefined).
isValidating: if there's a request or revalidation loading.

Options:
maxAge = 2: The maximum amount of time in seconds a resource is considered fresh.
maxStale = 10: Indicates the client will accept a stale response. An optional value in seconds indicates the upper limit of staleness the client will accepted. After such time, it is removed from the cache.
cache: An object containing the cache used to store the values fetched. The default uses an in memory object.

Cache:
value = get(key): Gets the value cached using the key. Returns undefined if not found.
set(key, value): Caches the value using the key.
set(key, value): Removes the key value pair from the cache.