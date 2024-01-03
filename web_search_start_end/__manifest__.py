# -*- coding: utf-8 -*-
{
    'name': 'Web Search Start-End',
    'version': '17.0.1.0.0',
    'summary': 'Web Search Start-End',
    'author': "Mainframe Monkey",
    'website': "https://www.mainframemonkey.com",
    'description': """
Web Search Start-End
    """,
    'category': 'Web',
    'depends': ['web'],
    'data': [
    ],
    'installable': True,
    'application': True,
    'assets': {
        'web.assets_backend': [
            "web_search_start_end/static/src/xml/tree_editor.xml",
            "web_search_start_end/static/src/js/tree_editor_operator_editor.js",
            "web_search_start_end/static/src/js/tree_editor_value_editors.js",
            "web_search_start_end/static/src/js/tree_editor.js",
            "web_search_start_end/static/src/utils.js",
            "web_search_start_end/static/src/js/search_model.js"
        ],
    },
    'license': 'LGPL-3',
}
