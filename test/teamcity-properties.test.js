"use strict";
var expect = require("must")
var tcp = require("../")

describe("teamcity-properties", function () {
  describe("#hashListByName", function () {
    it("converts input to expected output", function () {
      var data = {
        "build": {
          "teamcityProperties": [
            {"name": "foo", "value": "bar"},
            {"name": "ring.ding", "value": 42}
          ]
        }
      }
      var ideal = {
        "foo": "bar",
        "ring.ding": 42
      }
      var result = tcp.hashListByName(data.build.teamcityProperties)
      expect(result).to.eql(ideal)
    })
  })

  describe("#parametersToProperties", function () {
    it("works", function () {
      var result = tcp.parametersToProperties({context: "Selenium"})
      expect(result).to.eql(
        {"property": [{"name": "context", "value": "Selenium"}]})
    })
  })

  describe("#findParameters", function () {
    it("supports not finding a parameter", function () {
      var haystack = {foo: "bar"}
      var result = tcp.findParameters(haystack, "needle")
      expect(result).to.eql([])
    })

    it("finds parameter", function () {
      var haystack = {"needle": "foo"}
      var result = tcp.findParameters(haystack, "needle")
      expect(result).to.eql([{value: 'foo', key: 'root'}])
    })

    it("finds nested parameter", function () {
      var haystack = {"obfuscation.needle": "bar"}
      var result = tcp.findParameters(haystack, "needle")
      expect(result).to.eql([{"key": "obfuscation", "value": "bar"}])
    })

    it("understands multiple entries", function () {
      var haystack = {"needle": "ham", "hidden.needle": "spam"}
      var result = tcp.findParameters(haystack, "needle")
      expect(result).to.eql([
                              {"key": "root", "value": "ham"},
                              {"key": "hidden", "value": "spam"}
                            ])
    })

    it("Does not include identical 'system.build' entries", function () {
      var haystack = {
        "build.vcs.number": "123",
        "system.build.vcs.number": "123"
      }
      var result = tcp.findParameters(
        haystack, "vcs.number", ["system.build.vcs.number"])
      expect(result).to.eql([{"key": "build", "value": "123"}])
    })

    it("works on real-life data", function () {
      var haystacks = [
        {"dep.GithubPullRequests_EConomicEConomic_Build.vcsroot.url": "url"},
        //{"dep.vcsroot.url": "url"}
      ]
      haystacks.forEach(function (haystack) {
        var result = tcp.findParameters(haystack, "vcsroot.url")
        expect(result).to.have.length(1)
        expect(result[0]).to.have.property("value", "url")
      })
    })
  })
})
