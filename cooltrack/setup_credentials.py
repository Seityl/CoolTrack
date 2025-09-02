#!/usr/bin/env python3
"""
Setup script to encrypt your credentials for secure deployment
Run this once to generate encrypted versions of your credentials
"""

import os
import json
import base64
from cryptography.fernet import Fernet
from getpass import getpass

def generate_encryption_key():
    """Generate a new encryption key"""
    key = Fernet.generate_key()
    return key.decode()

def encrypt_credential(data, encryption_key):
    """Encrypt a credential string"""
    cipher = Fernet(encryption_key.encode())
    encrypted = cipher.encrypt(data.encode())
    return encrypted.decode()

def encrypt_json_credential(data_dict, encryption_key):
    """Encrypt a JSON credential"""
    json_str = json.dumps(data_dict, separators=(',', ':'))  # Compact JSON
    return encrypt_credential(json_str, encryption_key)

def main():
    print("🔐 Push Notification Credential Encryption Setup")
    print("=" * 50)
    
    # Step 1: Generate or use existing encryption key
    print("\n1. Encryption Key Setup")
    use_existing = input("Do you have an existing encryption key? (y/n): ").lower().strip()
    
    if use_existing == 'y':
        encryption_key = getpass("Enter your encryption key: ").strip()
        if not encryption_key:
            print("❌ No encryption key provided. Exiting.")
            return
    else:
        encryption_key = generate_encryption_key()
        print("✅ Generated new encryption key:")
        print(f"   {encryption_key}")
        print("\n⚠️  IMPORTANT: Store this key securely!")
        print("   You'll need to set it as CONFIG_ENCRYPTION_KEY environment variable")
    
    encrypted_vars = {}
    
    # Step 2: Firebase Service Account Key
    print("\n2. Firebase Service Account Key")
    firebase_option = input("Choose option - (1) File path, (2) Paste JSON, (3) Skip: ").strip()
    
    if firebase_option == '1':
        file_path = input("Enter path to Firebase service account JSON file: ").strip()
        try:
            with open(file_path, 'r') as f:
                firebase_data = json.load(f)
            encrypted_firebase = encrypt_json_credential(firebase_data, encryption_key)
            encrypted_vars['ENCRYPTED_FIREBASE_SERVICE_ACCOUNT_KEY'] = encrypted_firebase
            print("✅ Firebase credentials encrypted")
        except Exception as e:
            print(f"❌ Error reading Firebase file: {e}")
    
    elif firebase_option == '2':
        print("Paste your Firebase service account JSON (press Enter twice when done):")
        firebase_json_lines = []
        while True:
            line = input()
            if line.strip() == '' and firebase_json_lines:
                break
            firebase_json_lines.append(line)
        
        try:
            firebase_json = '\n'.join(firebase_json_lines)
            firebase_data = json.loads(firebase_json)
            encrypted_firebase = encrypt_json_credential(firebase_data, encryption_key)
            encrypted_vars['ENCRYPTED_FIREBASE_SERVICE_ACCOUNT_KEY'] = encrypted_firebase
            print("✅ Firebase credentials encrypted")
        except Exception as e:
            print(f"❌ Error parsing Firebase JSON: {e}")
    
    # Step 3: Frappe API Credentials
    print("\n3. Frappe API Credentials")
    api_key = getpass("Enter Frappe API Key (or press Enter to skip): ").strip()
    if api_key:
        encrypted_api_key = encrypt_credential(api_key, encryption_key)
        encrypted_vars['ENCRYPTED_FRAPPE_API_KEY'] = encrypted_api_key
        print("✅ API Key encrypted")
    
    api_secret = getpass("Enter Frappe API Secret (or press Enter to skip): ").strip()
    if api_secret:
        encrypted_api_secret = encrypt_credential(api_secret, encryption_key)
        encrypted_vars['ENCRYPTED_FRAPPE_API_SECRET'] = encrypted_api_secret
        print("✅ API Secret encrypted")
    
    # Step 4: VAPID Public Key
    print("\n4. VAPID Public Key")
    vapid_key = input("Enter VAPID Public Key (or press Enter to skip): ").strip()
    if vapid_key:
        encrypted_vapid = encrypt_credential(vapid_key, encryption_key)
        encrypted_vars['ENCRYPTED_VAPID_PUBLIC_KEY'] = encrypted_vapid
        print("✅ VAPID Key encrypted")
    
    # Step 5: Generate environment file
    print("\n5. Environment File Generation")
    if encrypted_vars:
        env_content = [f"# Encrypted credentials - generated on {os.popen('date').read().strip()}"]
        env_content.append(f"CONFIG_ENCRYPTION_KEY={encryption_key}")
        env_content.append("")
        
        for key, value in encrypted_vars.items():
            env_content.append(f"{key}={value}")
        
        env_content.append("")
        env_content.append("# Other required environment variables:")
        env_content.append("# FRAPPE_SITE=https://your-site.com")
        env_content.append("# FIREBASE_CONFIG={}")  # For client-side config if needed
        
        # Write to file
        with open('.env.encrypted', 'w') as f:
            f.write('\n'.join(env_content))
        
        print("✅ Environment file created: .env.encrypted")
        print("\n📋 Summary of encrypted variables:")
        for key in encrypted_vars.keys():
            print(f"   - {key}")
        
        print("\n🚀 Next Steps:")
        print("1. Copy the CONFIG_ENCRYPTION_KEY to your production environment")
        print("2. Copy the ENCRYPTED_* variables to your production environment")
        print("3. Ensure .env.encrypted is in your .gitignore")
        print("4. Test your application with the encrypted credentials")
        
        # Generate deployment script
        print("\n6. Deployment Script")
        generate_deployment = input("Generate deployment script? (y/n): ").lower().strip()
        if generate_deployment == 'y':
            create_deployment_script(encrypted_vars, encryption_key)
    
    else:
        print("❌ No credentials were encrypted")

def create_deployment_script(encrypted_vars, encryption_key):
    """Create a deployment script for easy environment setup"""
    
    script_content = f'''#!/bin/bash
# Deployment script for push notification service
# Generated automatically - DO NOT commit to version control

echo "Setting up encrypted environment variables..."

# Encryption key
export CONFIG_ENCRYPTION_KEY="{encryption_key}"

'''
    
    for key, value in encrypted_vars.items():
        script_content += f'export {key}="{value}"\n'
    
    script_content += '''
# Additional required variables (set these manually)
# export FRAPPE_SITE="https://your-site.com"

echo "✅ Environment variables set"
echo "Now you can run your application"
'''
    
    with open('deploy_env.sh', 'w') as f:
        f.write(script_content)
    
    # Make executable
    os.chmod('deploy_env.sh', 0o700)
    
    print("✅ Deployment script created: deploy_env.sh")
    print("   Usage: source deploy_env.sh")
    print("   ⚠️  DO NOT commit deploy_env.sh to version control!")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Setup cancelled by user")
    except Exception as e:
        print(f"\n❌ Setup failed: {e}")