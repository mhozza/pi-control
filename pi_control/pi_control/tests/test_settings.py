import importlib
import os
from unittest import TestCase
from unittest.mock import patch
from django.core.exceptions import ImproperlyConfigured
import pi_control.settings


class SettingsTestCase(TestCase):
    def tearDown(self):
        # Ensure settings module is in a clean working state after each test
        with patch.dict(os.environ, {"SECRET": "test-secret-key", "DEBUG": "True"}):
            importlib.reload(pi_control.settings)

    def test_env_helper_returns_none_default(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertIsNone(pi_control.settings.env("NON_EXISTENT_VAR"))
            self.assertIsNone(pi_control.settings.env("NON_EXISTENT_VAR", default=None))
            self.assertEqual(pi_control.settings.env("NON_EXISTENT_VAR", default="fallback"), "fallback")

    def test_bool_env_helper(self):
        with patch.dict(os.environ, {"FLAG_TRUE": "true", "FLAG_FALSE": "false", "FLAG_1": "1", "FLAG_0": "0"}):
            self.assertTrue(pi_control.settings.bool_env("FLAG_TRUE", False))
            self.assertTrue(pi_control.settings.bool_env("FLAG_1", False))
            self.assertFalse(pi_control.settings.bool_env("FLAG_FALSE", True))
            self.assertFalse(pi_control.settings.bool_env("FLAG_0", True))
            self.assertTrue(pi_control.settings.bool_env("UNSET_FLAG", True))
            self.assertFalse(pi_control.settings.bool_env("UNSET_FLAG", False))

    def test_debug_mode_fallback_secret(self):
        with patch.dict(os.environ, {"DEBUG": "True"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertTrue(pi_control.settings.DEBUG)
            self.assertTrue(bool(pi_control.settings.SECRET_KEY))
            self.assertEqual(
                pi_control.settings.SECRET_KEY,
                "django-insecure-dev-only-secret-key-pi-control",
            )

    def test_production_mode_requires_secret(self):
        with patch.dict(os.environ, {"DEBUG": "False"}, clear=True):
            with self.assertRaises(ImproperlyConfigured):
                importlib.reload(pi_control.settings)

    def test_production_mode_succeeds_with_secret(self):
        with patch.dict(os.environ, {"DEBUG": "False", "SECRET": "custom-prod-secret"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertFalse(pi_control.settings.DEBUG)
            self.assertEqual(pi_control.settings.SECRET_KEY, "custom-prod-secret")

    def test_oauth_credentials_have_no_hardcoded_defaults(self):
        with patch.dict(os.environ, {"DEBUG": "True"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertNotEqual(
                pi_control.settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY,
                "252833193334-p1smqapcll45s386594smrqld0l2ielj.apps.googleusercontent.com",
            )
            self.assertNotEqual(
                pi_control.settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET,
                "ocvhSjJyjKfMROBh4z8EUTA9",
            )
            self.assertEqual(pi_control.settings.SOCIAL_AUTH_GOOGLE_OAUTH2_KEY, "")
            self.assertEqual(pi_control.settings.SOCIAL_AUTH_GOOGLE_OAUTH2_SECRET, "")

    def test_oauth_pipeline_includes_auth_allowed_before_association(self):
        pipeline = pi_control.settings.SOCIAL_AUTH_PIPELINE
        self.assertIn("social_core.pipeline.social_auth.auth_allowed", pipeline)
        auth_allowed_idx = pipeline.index("social_core.pipeline.social_auth.auth_allowed")
        if "social_core.pipeline.social_auth.associate_by_email" in pipeline:
            assoc_email_idx = pipeline.index("social_core.pipeline.social_auth.associate_by_email")
            self.assertLess(auth_allowed_idx, assoc_email_idx)
        if "social_core.pipeline.social_auth.associate_user" in pipeline:
            assoc_user_idx = pipeline.index("social_core.pipeline.social_auth.associate_user")
            self.assertLess(auth_allowed_idx, assoc_user_idx)

    def test_debug_toolbar_middleware_loaded_when_debug_is_true(self):
        with patch.dict(os.environ, {"DEBUG": "True", "SECRET": "test-secret"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertTrue(pi_control.settings.DEBUG)
            self.assertIn("debug_toolbar", pi_control.settings.INSTALLED_APPS)
            self.assertIn("debug_toolbar.middleware.DebugToolbarMiddleware", pi_control.settings.MIDDLEWARE)
            self.assertEqual(pi_control.settings.MIDDLEWARE[0], "debug_toolbar.middleware.DebugToolbarMiddleware")

    def test_debug_toolbar_middleware_not_loaded_when_debug_is_false(self):
        with patch.dict(os.environ, {"DEBUG": "False", "SECRET": "test-secret"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertFalse(pi_control.settings.DEBUG)
            self.assertNotIn("debug_toolbar", pi_control.settings.INSTALLED_APPS)
            self.assertNotIn("debug_toolbar.middleware.DebugToolbarMiddleware", pi_control.settings.MIDDLEWARE)

    def test_debug_defaults_to_true_when_unset(self):
        with patch.dict(os.environ, {"SECRET": "test-secret"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertTrue(pi_control.settings.DEBUG)
            self.assertIn("debug_toolbar", pi_control.settings.INSTALLED_APPS)
            self.assertIn("debug_toolbar.middleware.DebugToolbarMiddleware", pi_control.settings.MIDDLEWARE)

    def test_production_security_settings_when_debug_false(self):
        with patch.dict(os.environ, {"DEBUG": "False", "SECRET": "test-secret"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertFalse(pi_control.settings.DEBUG)
            self.assertTrue(pi_control.settings.SESSION_COOKIE_SECURE)
            self.assertTrue(pi_control.settings.CSRF_COOKIE_SECURE)
            self.assertEqual(
                pi_control.settings.SECURE_PROXY_SSL_HEADER,
                ("HTTP_X_FORWARDED_PROTO", "https"),
            )
            self.assertFalse(pi_control.settings.SECURE_SSL_REDIRECT)

    def test_production_secure_ssl_redirect_can_be_enabled(self):
        with patch.dict(
            os.environ,
            {"DEBUG": "False", "SECRET": "test-secret", "SECURE_SSL_REDIRECT": "true"},
            clear=True,
        ):
            importlib.reload(pi_control.settings)
            self.assertTrue(pi_control.settings.SECURE_SSL_REDIRECT)

    def test_development_security_settings_when_debug_true(self):
        with patch.dict(os.environ, {"DEBUG": "True", "SECRET": "test-secret"}, clear=True):
            importlib.reload(pi_control.settings)
            self.assertTrue(pi_control.settings.DEBUG)
            self.assertFalse(getattr(pi_control.settings, "SESSION_COOKIE_SECURE", False))
            self.assertFalse(getattr(pi_control.settings, "CSRF_COOKIE_SECURE", False))
