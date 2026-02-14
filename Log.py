import os
from .Settings import Settings

USER_HOME = os.path.expanduser('~')
LOG_DIRECTORY = USER_HOME+"/Documents/Ableton/User Library/Remote Scripts"
LOG_FILE = LOG_DIRECTORY + "/log.txt"
ONEDRIVE_LOG_DIRECTORY = USER_HOME+"/OneDrive/Documents/Ableton/User Library/Remote Scripts"
ONEDRIVE_LOG_FILE = ONEDRIVE_LOG_DIRECTORY + "/log.txt"
SCRIPT_LOG_FILE = os.path.join(os.path.dirname(__file__), "log.txt")

LOG_FILES = [LOG_FILE, ONEDRIVE_LOG_FILE, SCRIPT_LOG_FILE]

def _safe_makedirs(path):
    try:
        os.makedirs(path, exist_ok=True)
    except TypeError:
        try:
            os.makedirs(path)
        except OSError:
            pass
    except OSError:
        pass

def _safe_append(path, text):
    try:
        with open(path, 'a') as f:
            f.write(text)
    except Exception:
        pass

if Settings.LOGGING:
    _safe_makedirs(LOG_DIRECTORY)
    _safe_makedirs(ONEDRIVE_LOG_DIRECTORY)
    for _path in LOG_FILES:
        _safe_append(_path, '====================\n')

log_num = 0

def log(message):
    global log_num
    if Settings.LOGGING:
        if type(message) == list:
            message = '\n'.join(message)
        line = str(log_num) + ' ' + str(message) + '\n'
        for _path in LOG_FILES:
            _safe_append(_path, line)
        log_num += 1
