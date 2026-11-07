from django.test import SimpleTestCase
from django.urls import resolve, reverse


class UrlsTestCase(SimpleTestCase):
    def test_core_url_reversals(self):
        self.assertEqual(reverse("home"), "/")
        self.assertEqual(reverse("login"), "/login/")
        self.assertEqual(reverse("logout"), "/logout/")

    def test_api_urls_resolve(self):
        match = resolve("/")
        self.assertEqual(match.view_name, "home")

        match = resolve("/login/")
        self.assertEqual(match.url_name, "login")

        match = resolve("/logout/")
        self.assertEqual(match.url_name, "logout")
