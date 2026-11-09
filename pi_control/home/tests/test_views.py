from django.apps import apps
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse

from home.apps import HomeConfig


class HomeViewTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            username="homeuser",
            email="homeuser@example.com",
            password="testpassword123",
        )

    def test_unauthenticated_user_redirected_to_login(self):
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response.url)

    def test_authenticated_user_renders_home(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, "pi_control/home/home.html")
        self.assertContains(response, '<div id="root"></div>')
        self.assertIn("csrftoken", self.client.cookies)

    def test_home_renders_bootstrap_icons_sri_and_crossorigin(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("home"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(
            response,
            'integrity="sha384-tKLJeE1ALTUwtXlaGjJYM3sejfssWdAaWR2s97axw4xkiAdMzQjtOjgcyw0Y50KU"',
        )
        self.assertContains(response, 'crossorigin="anonymous"')
        self.assertContains(response, 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css')

    def test_spa_detail_routes_render_home(self):
        self.client.force_login(self.user)
        for path in ("/temperature/1", "/temperature/1/", "/network", "/network/"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertTemplateUsed(response, "pi_control/home/home.html")


class HomeConfigTestCase(TestCase):
    def test_home_config_name(self):
        self.assertEqual(HomeConfig.name, "home")
        app_config = apps.get_app_config("home")
        self.assertIsInstance(app_config, HomeConfig)
