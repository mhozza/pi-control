from django.template import Context, Template
from django.test import SimpleTestCase

from pi_control.templatetags.pi_tags import split


class PiTagsTestCase(SimpleTestCase):
    def test_split_function_direct(self):
        self.assertEqual(split("a,b,c", ","), ["a", "b", "c"])
        self.assertEqual(split("apple:banana:orange", ":"), ["apple", "banana", "orange"])
        self.assertEqual(split("single", ","), ["single"])
        self.assertEqual(split("", ","), [""])

    def test_split_template_rendering(self):
        template = Template("{% load pi_tags %}{% for item in value|split:',' %}[{{ item }}]{% endfor %}")
        rendered = template.render(Context({"value": "one,two,three"}))
        self.assertEqual(rendered, "[one][two][three]")
