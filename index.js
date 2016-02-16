"use strict";
var ss = require("simple-strings.js")

/**
 * The tcwebhooks plugin outputs a *list* of teamcityProperties,
 * but how would one use those? Just hardcode index accessors everywhere?
 * Maybe search through the list again and again?
 * Instead we hash the elements by their `name` component.
 * */
exports.hashListByName = function (properties) {
  var ahash = {}
  for (var i = 0; i < properties.length; ++i) {
    var obj = properties[i]
    ahash[obj.name] = obj.value
  }
  return ahash
}

/**
 * Convert hash of parameter/values to Teamcity-styled properties.
 * @param {object} parametersByName Hash of parameter/value pairs,
 e.g. `{context:"Selenium"}`
 * @returns {{property:Array}} Array of Teamcity styled properties
 */
exports.parametersToProperties = function (parametersByName) {
  var properties = []
  for (var key in parametersByName) {
    if (!parametersByName.hasOwnProperty(key)) continue
    var value = parametersByName[key]
    properties.push({name: key, value: value})
  }
  return {property: properties}
}

/**
 * Return elements from `haystack` where the entry ends with `needle`.
 *
 * Teamcity webhooks do not make it easy to find specific parameters,
 * because it prefixes build-names for dependencies.
 * E.g. a build won't have a `vcsroot.url` parameter
 * if that build gets its VCS information from a parent dependency,
 * it would be called `dep.<parent-build-name>.vcsroot.url`..
 * To overcome that this function first searches `haystack` for an entry
 * that *ends with* `needle` (but does not end with any `ignores` entries),
 * then it takes that entry's value and
 * associates it with a *minified* version of the entry name.
 * *minified* means taking the entry name and *removing* the `needle` component,
 * e.g. `dep.some_dependency.vcsroot.url` turns into `dep.some_dependency`.
 * *Except* if the entry *is* the needle, then we just call it `root`.
 *
 * This is annoyingly complicated, but what else are we to do
 * when the webhook is so complicated?
 *
 * @param {Object} haystack
 * @param {String} needle
 * @param {Array<String>=} ignores
 * @returns {Array<{value:String, key:String}>}
 */
exports.findParameters = function (haystack, needle, ignores) {
  var hits = []
  var lookup = function (k) {
    if (ignores && ignores.some(function (ignore) {
        return ss.endsWith(k, ignore)
      })) {
      return
    }
    if (ss.endsWith(k, needle)) {
      var minified = k === needle ? "root" : k.replace("." + needle, "")
      return {value: haystack[k], key: minified}
    }
  }
  for (var key in haystack) {
    if (!haystack.hasOwnProperty(key)) continue
    var res = lookup(key)
    if (res)
      hits.push(res)
  }
  return hits
}
