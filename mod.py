#!/usr/bin/python2


def IsNakedWildcardChar(c):
  """True iff. the given character is valid in a naked wildcard."""
  return c.isalnum() or c == '_'


def Scan(tmpl):
  """Scan a template string, yielding tokens one at a time.

  Naked wildcards are introduced by %% and end at the first character which is
  not a valid naked wildcard character.  If the first character after the %%
  is open brace, then the wildcard is not naked and will continue until the
  braces close.

    A token is:
      (code, lexeme)

    and codes are:
      0: plain text
      1: naked wildcard
      2: brace-enclosed wildcard

  Args:
    tmpl: The string to scan.

  Raises:
    ValueError: if the template ends inside a brace-enclosed wildcard or if
    an invalid character follows a %%
  """
  state = 0
  c = None
  next_pos = 0
  while True:
    # if we don't have a character, get the next one from the template
    # if the template is out of characters, 'c' will just stay None
    if c is None:
      pos = next_pos
      if pos < len(tmpl):
        c = tmpl[pos]
        next_pos += 1
    # take action based on our current state
    if state == 0:
      # looking for start of token
      if c is None:
        # found end-of-text; time to go
        break
      if c == '%':
        # disambugate leading percent-sign
        c = None
        state = 2
      else:
        # recognize start of plain string token
        anchor = pos
        c = None
        state = 1
    elif state == 1:
      # looking for end of plain string token
      if c is None or c == '%':
        # found end-of-token
        yield 0, tmpl[anchor:pos]
        del anchor
        state = 0
      else:
        # keep going
        c = None
    elif state == 2:
      # disambiguating leading percent-sign
      if c == '%':
        # recognize start of wildcard
        c = None
        state = 3
      else:
        # the percent-sign was just a percent sign
        # so yield it as plain text and continue
        yield 0, '%'
        state = 0
    elif state == 3:
      # found a double percent-sign, so this is some kind of wildcard
      if c is None:
        raise ValueError('end-of-template after wildcard introducer')
      if IsNakedWildcardChar(c):
        # recognize start of naked wildcard
        anchor = pos
        c = None
        state = 4
      elif c == '{':
        # recognize start of brace-enclosed wildcard
        anchor = pos
        brace_depth = 1
        c = None
        state = 5
      else:
        raise ValueError('weird character after wildcard introducer')
    elif state == 4:
      # looking for end of naked wildcard
      if c is None or not IsNakedWildcardChar(c):
        # found end-of-token
        yield 1, tmpl[anchor:pos]
        del anchor
        state = 0
      else:
        # keep going
        c = None
    elif state == 5:
      # looking for end of brace-enclosed wildcard
      if c is None:
        raise ValueError('end-of-template inside brace-enclosed wildcard')
      if c == '{':
        # stepping in one level
        brace_depth += 1
        c = None
      elif c == '}':
        # stepping out one level
        brace_depth -= 1
        c = None
        if brace_depth == 0:
          # found end-of-token
          yield 2, tmpl[anchor + 1:pos]
          del anchor
          del brace_depth
          state = 0
      else:
        # keep going
        c = None


class Template(object):
  """A string templating object.

  Usage Example
    tmpl = Template('One must %%{key} templates. Says here in this file... \n %%{filename.txt}')
    print tmpl % { 'key': 'value', 'key2': 50 }

  Operators:
    self % dict: return a string formatted with the given static content

  Properties:
    wildcards: the set of wildcards contained in the template
  """

  def __init__(self, tmpl, stack=(), cache={}):
    """Construct a template with the given pattern string.

    The stack and cache arguments are used by Template when recursing.
    You shouldn't pass them yourself.

    Args:
      tmpl: a template pattern of the kind used by Scan()
    """
    super(Template, self).__init__()
    tokens = []
    wildcards = set()
    for token in Scan(tmpl):
      tokens.append(token)
      code, lexeme = token
      if code == 1 or code == 2:
        wildcards.add(lexeme)
    self.__tokens = tuple(tokens)
    self.__wildcards = frozenset(wildcards)
    self.__cache = cache
    self.__stack = stack

  def __mod__(self, other):
    """Return a string formatted with the given static content."""
    def Piece(code, lexeme):
      """Return the text for the given token."""
      if code == 0:
        # token is just text
        val = lexeme
      else:
        # token is a wildcard, so try to find the value
        # in the argument dictionary
        val = other.get(lexeme)
        if val is None:
          # nothing in the argument dictionary, so try our cache
          val = self.__cache.get(lexeme)
          if val is None:
            # nothing in the cache, so we'll try to open it as a file
            if lexeme in self.__stack:
              # oops, we're already working on that file, so this is a cycle
              raise ValueError('cycle in wildcard stack: %r' % (self.__stack, ))
            try:
              # read the file, process it as a template,
              # and stash the result in our cache
              val = Template(
                  open(lexeme, 'r').read(),
                  self.__stack + (lexeme, ),
                  self.__cache) % other
              self.__cache[lexeme] = val
            except IOError:
              # er, the file didn't exist, so we'll just stick the wildcard
              # lexeme back in there and hope for the best?
              val = lexeme
      return str(val)
    # join all the token pieces together
    return ''.join(Piece(*token) for token in self.__tokens)

  @property
  def wildcards(self):
    """The set of wildcards contained in this template."""
    return self.__wildcards