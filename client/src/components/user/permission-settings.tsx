import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionSection, PERMISSION_CATEGORIES } from '@/components/ui/permission-section';
import { ROLE_PERMISSIONS } from '@shared/permissions';

interface PermissionSettingsProps {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  onPermissionChange: (permission: string, value: boolean) => void;
  onResetPermissions: () => void;
}

export function PermissionSettings({
  formData,
  setFormData,
  onPermissionChange,
  onResetPermissions
}: PermissionSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">세부 권한 설정</h4>
        <Button 
          type="button"
          variant="outline" 
          size="sm"
          onClick={onResetPermissions}
        >
          기본 권한으로 초기화
        </Button>
      </div>
      
      {Object.entries(PERMISSION_CATEGORIES).map(([categoryKey, category]) => {
        const permissions = category.permissions.map(perm => {
          const defaultValue = ROLE_PERMISSIONS[formData.role as keyof typeof ROLE_PERMISSIONS]?.[perm.key as keyof typeof ROLE_PERMISSIONS[keyof typeof ROLE_PERMISSIONS]] || false;
          const currentValue = formData[perm.key as keyof typeof formData] || false;
          
          return {
            permission: perm.key,
            label: perm.label,
            description: perm.description,
            value: Boolean(currentValue),
            defaultValue: Boolean(defaultValue),
            onChange: (checked: boolean) => onPermissionChange(perm.key, checked),
          };
        });
        
        const hasChanges = permissions.some(p => p.value !== p.defaultValue);
        
        return (
          <PermissionSection
            key={categoryKey}
            title={category.title}
            icon={category.icon}
            permissions={permissions}
            hasChanges={hasChanges}
            onResetToDefault={() => {
              const roleDefaults = ROLE_PERMISSIONS[formData.role as keyof typeof ROLE_PERMISSIONS] || {};
              const updates: any = {};
              category.permissions.forEach(perm => {
                updates[perm.key] = roleDefaults[perm.key as keyof typeof roleDefaults] || false;
              });
              setFormData((prev: any) => ({ ...prev, ...updates }));
            }}
          />
        );
      })}
    </div>
  );
}