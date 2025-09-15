import frappe

def before_uninstall():
    print('Starting Cool Track uninstallation...')
    remove_custom_roles()
    cleanup_role_assignments()

def after_uninstall():
    print('Finalizing Cool Track uninstallation...')
    remove_custom_roles()
    cleanup_custom_fields()
    print('Cool Track uninstallation completed successfully')

def remove_custom_roles():
    roles_to_remove = ['Cool Track User', 'Cool Track Manager']
    
    for role_name in roles_to_remove:
        if frappe.db.exists('Role', role_name):
            try:
                remove_role_assignments(role_name)
                remove_custom_permissions(role_name)
                frappe.delete_doc('Role', role_name, ignore_permissions=True, force=True)
                print(f'Removed role: {role_name}')
                
            except Exception as e:
                print(f'Could not remove role {role_name}: {str(e)}')

        else:
            print(f'Role {role_name} does not exist')

def remove_role_assignments(role_name):
    try:
        user_roles = frappe.get_all('Has Role', 
            filters={'role': role_name},
            fields=['parent', 'name']
        )
        
        for user_role in user_roles:
            frappe.delete_doc('Has Role', user_role.name, ignore_permissions=True, force=True)
            print(f'  - Removed role assignment from user: {user_role.parent}')
            
    except Exception as e:
        print(f'Error removing role assignments for {role_name}: {str(e)}')

def remove_custom_permissions(role_name):
    try:
        custom_perms = frappe.get_all('Custom DocPerm',
            filters={'role': role_name},
            fields=['name', 'parent']
        )
        
        for perm in custom_perms:
            frappe.delete_doc('Custom DocPerm', perm.name, ignore_permissions=True, force=True)
            print(f'  - Removed custom permission for {perm.parent}')
            
        doc_perms = frappe.get_all('DocPerm',
            filters={'role': role_name},
            fields=['name', 'parent']
        )
        
        for perm in doc_perms:
            try:
                frappe.delete_doc('DocPerm', perm.name, ignore_permissions=True, force=True)
                print(f'  - Removed standard permission for {perm.parent}')

            except Exception as e:
                print(f'  - Could not remove standard permission: {str(e)}')
                
    except Exception as e:
        print(f'⚠️ Error removing permissions for {role_name}: {str(e)}')

def cleanup_role_assignments():
    try:
        orphaned_roles = frappe.db.sql("""
            SELECT name, parent, role 
            FROM `tabHas Role` 
            WHERE role IN ('Cool Track User', 'Cool Track Manager')
        """, as_dict=True)
        
        for role_assignment in orphaned_roles:
            try:
                frappe.delete_doc('Has Role', role_assignment.name, ignore_permissions=True, force=True)
                print(f'  - Cleaned up orphaned role assignment: {role_assignment.role} from {role_assignment.parent}')

            except Exception as e:
                print(f'  - Could not clean up role assignment: {str(e)}')
                
    except Exception as e:
        print(f'Error during role assignment cleanup: {str(e)}')

def cleanup_custom_fields():
    try:
        custom_fields = frappe.get_all('Custom Field',
            filters={'module': 'Cool Track'},
            fields=['name', 'dt', 'fieldname']
        )
        
        for field in custom_fields:
            try:
                frappe.delete_doc('Custom Field', field.name, ignore_permissions=True, force=True)
                print(f'  - Removed custom field: {field.dt}.{field.fieldname}')

            except Exception as e:
                print(f'  - Could not remove custom field {field.name}: {str(e)}')
                
    except Exception as e:
        print(f'Error cleaning up custom fields: {str(e)}')