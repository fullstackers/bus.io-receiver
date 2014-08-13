EventEmitter = require('events').EventEmitter
Common = require 'bus.io-common'
Message = Common.Message
Controller = Common.Controller
Switched = require 'switched'

describe.only 'Router', ->

  Given -> @Router = requireSubject 'lib/router2', {
    'bus.io-common': Common
    'switched': Switched
  }

  describe '#', ->

    When -> @res = @Router()
    Then -> expect(@res instanceof @Router).toBe true
    And -> expect(@res instanceof EventEmitter).toBe true

  describe 'prototype', ->

    Given -> @router = @Router()

    describe '#route(msg:Message, end:Function)', ->

      Given -> @msg = Message()
      Given -> @end = jasmine.createSpy()
      When -> @router.route @msg, @end
      Then ->
        expect(@end).toHaveBeenCalledWith null, jasmine.any(Controller)
        console.log @end
      And -> expect(@end.mostRecentCall.args[0]).toBe null
      And -> expect(@end.mostRecentCall.args[1].message).toBe @msg

    describe '#route(msg:Message, sock:Socket, end:Function)', ->

      Given -> @msg = Message()
      Given -> @sock = new EventEmitter()
      Given -> @end = jasmine.createSpy()
      When -> @router.route @msg, @sock, @end
      Then ->
        expect(@end).toHaveBeenCalledWith null, jasmine.any(Controller), @sock
        console.log @end
      And -> expect(@end.mostRecentCall.args[0]).toBe null
      And -> expect(@end.mostRecentCall.args[1].message).toBe @msg
      And -> expect(@end.mostRecentCall.args[2]).toBe @sock
