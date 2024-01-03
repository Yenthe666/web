from odoo.tools import SQL
from odoo.osv import expression

NEW_TERM_OPERATORS = ('=', '!=', '<=', '<', '>', '>=', '=?', '=like', '=ilike', "startlike", "endlike",
                'like', 'not like', 'ilike', 'not ilike', 'in', 'not in',
                'child_of', 'parent_of', 'any', 'not any')


NEW_SQL_OPERATORS = {
    '=': SQL('='),
    '!=': SQL('!='),
    '<=': SQL('<='),
    '<': SQL('<'),
    '>': SQL('>'),
    '>=': SQL('>='),
    'in': SQL('IN'),
    'not in': SQL('NOT IN'),
    '=like': SQL('LIKE'),
    '=ilike': SQL('ILIKE'),
    'like': SQL('LIKE'),
    'ilike': SQL('ILIKE'),
    'not like': SQL('NOT LIKE'),
    'not ilike': SQL('NOT ILIKE'),
    'startlike': SQL('ILIKE'),
    'endlike': SQL('ILIKE'),
}


expression.TERM_OPERATORS = NEW_TERM_OPERATORS
expression.SQL_OPERATORS = NEW_SQL_OPERATORS
