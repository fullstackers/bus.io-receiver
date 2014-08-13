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
    Given -> @fn = jasmine.createSpy()
    Given -> @msg = Message()
    Given -> @end = jasmine.createSpy()

    describe '#route(msg:Message, end:Function)', ->

      When -> @router.route @msg, @end
      Then -> expect(@end).toHaveBeenCalledWith null, jasmine.any(Controller)
      And -> expect(@end.mostRecentCall.args[0]).toBe null
      And -> expect(@end.mostRecentCall.args[1].message).toBe @msg

    describe '#route(msg:Message, sock:Socket, end:Function)', ->

      Given -> @sock = new EventEmitter()
      When -> @router.route @msg, @sock, @end
      Then -> expect(@end).toHaveBeenCalledWith null, jasmine.any(Controller), @sock
      And -> expect(@end.mostRecentCall.args[0]).toBe null
      And -> expect(@end.mostRecentCall.args[1].message).toBe @msg
      And -> expect(@end.mostRecentCall.args[2]).toBe @sock

    describe '#use(fn:Function)', ->

      Given -> @wrap = @router._wrap @fn
      Given -> spyOn(@Router,'flatten').andCallThrough()
      Given -> spyOn(@router,'_wrap').andReturn @wrap
      Given -> spyOn(@router._router,'use').andCallThrough()
      When -> @res = @router.use @fn
      Then -> expect(@res).toBe @router
      And -> expect(@Router.flatten).toHaveBeenCalled()
      And -> expect(@router._wrap).toHaveBeenCalledWith @fn
      And -> expect(@router._router.use).toHaveBeenCalledWith @wrap

    describe '#_wrap(fn:Function)', ->

      context 'unwrapped', ->

        When -> @res = @router._wrap @fn
        Then -> expect(@res.fn).toBe @fn

      context 'wrapped', ->

        Given -> @wrap = @router._wrap @fn
        When -> @res = @router._wrap @wrap
        Then -> expect(@res).toBe @wrap

        context 'invocation', ->

          When -> @wrap 1, 2
          And -> expect(@fn).toHaveBeenCalledWith 1
  
    describe '#_event(name:String)', ->

      Given -> @name = 'some event'
      When -> @res = @router._event @name
      Then -> expect(typeof @res).toBe 'function'

      describe 'invocation', ->

        Given -> spyOn(EventEmitter.prototype.emit,'apply').andCallThrough()
        Given -> spyOn(@router,'emit').andCallThrough()
        When -> @res 1
        Then -> expect(@router.emit).toHaveBeenCalledWith 'done', @name, [1]
        And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @router, [@name]
        
  describe '#flatten', ->

    Given -> @a = ['a', ['b', 'c', ['d', 'e'], 'f'], 'g']
    When -> @res = @Router.flatten @a
    Then -> expect(@res).toEqual ['a', 'b', 'c', 'd', 'e', 'f', 'g']

