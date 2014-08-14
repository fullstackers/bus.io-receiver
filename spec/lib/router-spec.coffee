EventEmitter = require('events').EventEmitter
Common = require 'bus.io-common'
Message = Common.Message
Controller = Common.Controller
Switched = require 'switched'

describe 'Router', ->

  Given -> spyOn(EventEmitter.prototype.emit,'apply').andCallThrough()
  Given -> @Router = requireSubject 'lib/router', {
    'bus.io-common': Common
    'switched': Switched
  }

  describe '#', ->

    When -> @res = @Router()
    Then -> expect(@res instanceof @Router).toBe true
    And -> expect(@res instanceof EventEmitter).toBe true
    And -> expect(@res._router.fns()[0][1]).toBe @res._attachEvents

  describe 'prototype', ->

    Given -> @router = @Router()
    Given -> spyOn(@router,'emit').andCallThrough()
    Given -> @fn = jasmine.createSpy('fn')
    Given -> @msg = Message()
    Given -> @next = jasmine.createSpy('next')
    Given -> @end = jasmine.createSpy('end')

    describe '#route(msg:Message, end:Function)', ->

      When -> @router.route @msg, @end
      Then -> expect(@end).toHaveBeenCalled()
      And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @router, ['next', @msg]

    describe '#route(err:Error, msg:Message, end:Function)', ->

      Given -> @err = new Error
      Given -> @router.on 'error', (err) ->
      Given -> @router.use (msg, next) => next @err
      When -> @router.route @msg, @end
      Then -> expect(@end).toHaveBeenCalled()
      And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @router, ['error', @err, @msg]

    describe '#route(msg:Message, sock:Socket, end:Function)', ->

      Given -> @sock = new EventEmitter()
      When -> @router.route @msg, @sock, @end
      Then -> expect(@end).toHaveBeenCalled()
      And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @router, ['next', @msg, @sock]

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
      When -> @res = @router._event @name, @end
      Then -> expect(typeof @res).toBe 'function'

      describe 'invocation', ->

        When -> @res 1
        Then -> expect(@router.emit).toHaveBeenCalledWith 'done', @name, [1]
        And -> expect(EventEmitter.prototype.emit.apply).toHaveBeenCalledWith @router, [@name]
        And -> expect(@end).toHaveBeenCalled()

    describe '#_attachEvents(msg:Controller)', ->

      Given -> @deliver = 'deliver'
      Given -> @respond = 'respond'
      Given -> @consume = 'consume'
      Given -> @controller = Controller @msg
      Given -> spyOn(@router, '_event').andCallThrough()
      When -> @router._attachEvents @controller, @next, @end
      Then -> expect(@next).toHaveBeenCalled()
      And -> expect(@router._event.argsForCall[0]).toEqual [@deliver, @end]
      And -> expect(@controller.listeners(@deliver).length).toBe 1
      And -> expect(@router._event.argsForCall[1]).toEqual [@respond, @end]
      And -> expect(@controller.listeners(@respond).length).toBe 1
      And -> expect(@router._event.argsForCall[2]).toEqual [@consume, @end]
      And -> expect(@controller.listeners(@consume).length).toBe 1

  describe '#flatten', ->

    Given -> @a = ['a', ['b', 'c', ['d', 'e'], 'f'], 'g']
    When -> @res = @Router.flatten @a
    Then -> expect(@res).toEqual ['a', 'b', 'c', 'd', 'e', 'f', 'g']

