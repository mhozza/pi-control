from django.template.loader import render_to_string
from django.test import SimpleTestCase


class DummyMessage:
    def __init__(self, message, level_tag="info"):
        self.message = message
        self.level_tag = level_tag

    def __str__(self):
        return self.message


class BaseTemplateSecurityTestCase(SimpleTestCase):
    def test_messages_are_auto_escaped(self):
        xss_payload = "<script>alert('xss')</script>"
        rendered = render_to_string(
            "pi_control/base.html",
            {
                "messages": [DummyMessage(xss_payload)],
                "user": type("User", (), {"is_staff": False})(),
            },
        )
        self.assertNotIn("<script>alert('xss')</script>", rendered)
        self.assertIn("&lt;script&gt;alert(", rendered)

    def test_tag_attributes_are_quoted(self):
        rendered = render_to_string(
            "pi_control/base.html",
            {
                "messages": [],
                "user": type("User", (), {"is_staff": False})(),
            },
        )
        self.assertIn('<div class="container">', rendered)
        self.assertNotIn("<div class=container>", rendered)
        self.assertIn('<img src="/static/icon/raspberry.svg" width="30" height="30" />', rendered)
        self.assertNotIn("src=/static/icon/raspberry.svg", rendered)
