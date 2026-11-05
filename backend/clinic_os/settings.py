import os
from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv

# Load .env file if available
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.environ.get('SECRET_KEY', 'bvg-clinicos-secure-jwt-key-2026-enterprise-healthcare-platform-master-production-key')

# In production (ENVIRONMENT=production), DEBUG defaults to False
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
if ENVIRONMENT == 'production':
    DEBUG = os.environ.get('DEBUG', 'False').lower() in ('true', '1', 'yes')
else:
    DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', '1', 'yes')

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '*').split(',') if os.environ.get('ALLOWED_HOSTS') else ['*']
# Always include common hosts and wildcard patterns in ALLOWED_HOSTS
if '*' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.extend(['127.0.0.1', 'localhost', '.onrender.com', '.vercel.app'])

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'whitenoise.runserver_nostatic',
    'django.contrib.staticfiles',

    # Third-party packages
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',

    # BVG ClinicOS Modules
    'apps.core',
    'apps.patients',
    'apps.doctors',
    'apps.appointments',
    'apps.queues',
    'apps.clinical',
    'apps.ipd',
    'apps.emergency',
    'apps.operation_theatre',
    'apps.pharmacy',
    'apps.laboratory',
    'apps.radiology',
    'apps.billing',
    'apps.insurance',
    'apps.blood_bank',
    'apps.hr',
    'apps.accounting',
    'apps.telemedicine',
    'apps.analytics',
    'apps.ai_insights',
]

# Cloudinary Storage integration for production media
CLOUDINARY_URL = os.environ.get('CLOUDINARY_URL')
CLOUDINARY_CLOUD_NAME = os.environ.get('CLOUDINARY_CLOUD_NAME')
if CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME:
    INSTALLED_APPS.insert(0, 'cloudinary_storage')
    INSTALLED_APPS.append('cloudinary')
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': CLOUDINARY_CLOUD_NAME or os.environ.get('CLOUDINARY_NAME'),
        'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
        'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
    }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'

AUTH_USER_MODEL = 'core.User'

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'clinic_os.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'clinic_os.wsgi.application'

# Database configuration: defaults to SQLite in dev, connects to Neon/Render PostgreSQL in prod
DATABASE_URL = os.environ.get('DATABASE_URL')
if DATABASE_URL:
    import dj_database_url
    # Enable SSL for Neon & Render PostgreSQL connections
    ssl_req = 'neon' in DATABASE_URL or 'render' in DATABASE_URL or not DEBUG
    DATABASES = {
        'default': dj_database_url.config(
            default=DATABASE_URL,
            conn_max_age=600,
            conn_health_checks=True,
            ssl_require=ssl_req
        )
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 6}},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.AllowAny', # Permissive at global level, enforced per view
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# CORS & CSRF Settings
CORS_ALLOW_ALL_ORIGINS = DEBUG or os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'False').lower() in ('true', '1')
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/.*\.vercel\.app$",
    r"^https:\/\/.*\.onrender\.com$",
    r"^http:\/\/localhost:\d+$",
    r"^http:\/\/127\.0\.0\.1:\d+$",
]
CSRF_TRUSTED_ORIGINS = [
    'https://*.vercel.app',
    'https://*.onrender.com',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
]
FRONTEND_URL = os.environ.get('FRONTEND_URL')
if FRONTEND_URL:
    CSRF_TRUSTED_ORIGINS.append(FRONTEND_URL)

CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
    'accept',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-branch-id',
]

# Production Security Headers
if not DEBUG:
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() in ('true', '1')
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Production Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': os.environ.get('LOG_LEVEL', 'INFO'),
    },
}
