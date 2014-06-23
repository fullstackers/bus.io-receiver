describe 'lib', ->
  
  Given -> @lib = requireSubject 'lib', {
    './../package.json':
      version: 1
  }

  describe '#', ->

    Then -> expect(@lib() instanceof @lib.Receiver).toBe true

  describe '.version', ->

    When -> @version = @lib.version
    Then -> expect(@version).toEqual 1

  describe '.Receiver', ->

    Then -> expect(typeof @lib.Receiver).toBe 'function'
