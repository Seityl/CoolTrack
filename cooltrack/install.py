import os
import frappe
import subprocess

def before_install():
    print('Starting Cool Track installation...')

def after_install():
    try:
        install_python_requirements()
        install_frontend_dependencies()
        
        print('Cool Track installation completed successfully')
        
    except Exception as e:
        frappe.throw(f'Installation failed: {str(e)}')

def install_python_requirements():
    app_path = frappe.get_app_path('cooltrack')
    requirements_file = os.path.join(app_path, '..', 'requirements.txt')
    
    if os.path.exists(requirements_file):
        try:
            subprocess.check_call([
                'pip', 'install', '-r', requirements_file
            ])
            print('Python requirements installed')

        except subprocess.CalledProcessError as e:
            frappe.throw(f'Failed to install Python requirements: {str(e)}')

def install_frontend_dependencies():
    app_path = frappe.get_app_path('cooltrack')
    frontend_path = os.path.join(app_path, '..', 'frontend')
    package_json = os.path.join(frontend_path, 'package.json')
    
    if os.path.exists(package_json):
        try:
            os.chdir(frontend_path)
            subprocess.check_call(['yarn', 'install'])
            print('Frontend dependencies installed')

        except subprocess.CalledProcessError as e:
            print(f'Frontend dependency installation failed: {str(e)}')