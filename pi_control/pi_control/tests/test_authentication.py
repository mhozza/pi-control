from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from pi_control.authentication import QueryStringBasedTokenAuthentication


class QueryStringBasedTokenAuthenticationTestCase(TestCase):
    def setUp(self):
        self.auth = QueryStringBasedTokenAuthentication()
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="testpassword123",
        )
        self.token = Token.objects.create(user=self.user)

    def test_valid_token_authenticates(self):
        request = self.factory.get(f"/?token={self.token.key}")
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        auth_user, token = result
        self.assertEqual(auth_user, self.user)
        self.assertEqual(token, self.token)

    def test_valid_token_with_whitespace_stripping(self):
        request = self.factory.get(f"/?token=  {self.token.key}  ")
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        auth_user, token = result
        self.assertEqual(auth_user, self.user)
        self.assertEqual(token, self.token)

    def test_invalid_token_raises_authentication_failed(self):
        request = self.factory.get("/?token=invalid_token_12345")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_missing_token_returns_none(self):
        request = self.factory.get("/")
        self.assertIsNone(self.auth.authenticate(request))

    def test_empty_or_whitespace_token_returns_none(self):
        request = self.factory.get("/?token=   ")
        self.assertIsNone(self.auth.authenticate(request))
