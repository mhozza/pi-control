import warnings
from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.authtoken.models import Token
from rest_framework.exceptions import AuthenticationFailed
from rest_framework.test import APIRequestFactory

from pi_control.authentication import (
    QueryStringBasedTokenAuthentication,
    SafeTokenAuthentication,
)


class SafeTokenAuthenticationTestCase(TestCase):
    def setUp(self):
        self.auth = SafeTokenAuthentication()
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="testpassword123",
        )
        self.token = Token.objects.create(user=self.user)

    def test_alias_is_identical(self):
        self.assertIs(QueryStringBasedTokenAuthentication, SafeTokenAuthentication)

    def test_bearer_header_authenticates(self):
        request = self.factory.get("/", HTTP_AUTHORIZATION=f"Bearer {self.token.key}")
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        auth_user, token = result
        self.assertEqual(auth_user, self.user)
        self.assertEqual(token, self.token)

    def test_token_header_authenticates(self):
        request = self.factory.get("/", HTTP_AUTHORIZATION=f"Token {self.token.key}")
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        auth_user, token = result
        self.assertEqual(auth_user, self.user)
        self.assertEqual(token, self.token)

    def test_invalid_bearer_header_raises_authentication_failed(self):
        request = self.factory.get("/", HTTP_AUTHORIZATION="Bearer invalid_key_999")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

    def test_malformed_bearer_header_raises_authentication_failed(self):
        request = self.factory.get("/", HTTP_AUTHORIZATION="Bearer")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request)

        request_spaces = self.factory.get("/", HTTP_AUTHORIZATION="Bearer extra parts here")
        with self.assertRaises(AuthenticationFailed):
            self.auth.authenticate(request_spaces)

    def test_body_token_authenticates(self):
        request = self.factory.post("/", {"token": self.token.key}, format="json")
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        auth_user, token = result
        self.assertEqual(auth_user, self.user)
        self.assertEqual(token, self.token)

    def test_body_api_key_authenticates(self):
        request = self.factory.post("/", {"api_key": self.token.key}, format="json")
        result = self.auth.authenticate(request)
        self.assertIsNotNone(result)
        auth_user, token = result
        self.assertEqual(auth_user, self.user)
        self.assertEqual(token, self.token)

    def test_deprecated_query_param_token_authenticates_with_warning(self):
        request = self.factory.get(f"/?token={self.token.key}")
        with warnings.catch_warnings(record=True) as recorded_warnings:
            warnings.simplefilter("always")
            result = self.auth.authenticate(request)
            self.assertIsNotNone(result)
            auth_user, token = result
            self.assertEqual(auth_user, self.user)
            self.assertEqual(token, self.token)
            self.assertTrue(
                any(issubclass(w.category, DeprecationWarning) for w in recorded_warnings),
                "Expected DeprecationWarning for query string token",
            )

    def test_deprecated_query_param_with_whitespace_stripping(self):
        request = self.factory.get(f"/?token=  {self.token.key}  ")
        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            result = self.auth.authenticate(request)
            self.assertIsNotNone(result)
            auth_user, token = result
            self.assertEqual(auth_user, self.user)
            self.assertEqual(token, self.token)

    def test_invalid_query_param_token_raises_authentication_failed(self):
        request = self.factory.get("/?token=invalid_token_12345")
        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            with self.assertRaises(AuthenticationFailed):
                self.auth.authenticate(request)

    def test_missing_credentials_returns_none(self):
        request = self.factory.get("/")
        self.assertIsNone(self.auth.authenticate(request))

    def test_empty_or_whitespace_token_returns_none(self):
        request = self.factory.get("/?token=   ")
        self.assertIsNone(self.auth.authenticate(request))
