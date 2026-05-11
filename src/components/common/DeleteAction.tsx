import React from 'react';
import { Button, Popconfirm } from 'antd';
import type { ButtonProps } from 'antd';

interface DeleteActionProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  disabled?: boolean;
  loading?: boolean;
  buttonText?: string;
  size?: ButtonProps['size'];
}

export const DeleteAction: React.FC<DeleteActionProps> = ({
  title,
  description = "L'operazione non può essere annullata.",
  onConfirm,
  disabled = false,
  loading = false,
  buttonText = 'Elimina',
  size = 'small',
}) => (
  <Popconfirm
    title={title}
    description={description}
    okText="Elimina"
    cancelText="Annulla"
    okButtonProps={{ danger: true }}
    disabled={disabled}
    onConfirm={onConfirm}
  >
    <Button
      size={size}
      danger={true}
      disabled={disabled}
      loading={loading}
    >
      {buttonText}
    </Button>
  </Popconfirm>
);
