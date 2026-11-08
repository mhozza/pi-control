import os

os.environ.setdefault("SECRET", "test-secret-key-for-testing-only")
from pi_control.settings import *

# 1. In-memory SQLite
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }
}

# 2. Celery synchronous in-memory execution
CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True
CELERY_BROKER_URL = "memory://"
CELERY_RESULT_BACKEND = "cache+memory://"

# 3. Disable Debug Toolbar for tests
DEBUG = False
DEBUG_TOOLBAR_CONFIG = {
    "SHOW_TOOLBAR_CALLBACK": lambda request: False,
    "IS_RUNNING_TESTS": False,
}
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != "debug_toolbar"]
MIDDLEWARE = [m for m in MIDDLEWARE if "debug_toolbar" not in m]
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False
SECURE_SSL_REDIRECT = False

# 4. Fast Password Hasher
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.MD5PasswordHasher",
]

# 5. Isolation defaults for host & hardware
SERVER_NAME = "test-server"
CPU_TEMPERATURE_FILE = None
BACKUP_FILENAME = None

# 6. In-memory email backend
EMAIL_BACKEND = "django.core.mail.backends.locmem.EmailBackend"

# 7. Test runner with top-level discovery matching BASE_DIR
from django.test.runner import DiscoverRunner


class PiControlTestRunner(DiscoverRunner):
    def __init__(self, *args, **kwargs):
        if not kwargs.get("top_level"):
            kwargs["top_level"] = BASE_DIR
        super().__init__(*args, **kwargs)

    def build_suite(self, test_labels=None, **kwargs):
        if not test_labels or test_labels == ["."] or test_labels == (".",):
            test_labels = ["pi_control", "home", "network", "pc_status", "server_stats", "temperature"]
        return super().build_suite(test_labels=test_labels, **kwargs)


TEST_RUNNER = "pi_control.test_settings.PiControlTestRunner"
