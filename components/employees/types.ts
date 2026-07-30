export type DeleteItemType = 'qual' | 'skill' | 'exp' | 'ref' | 'disc' | 'contract' | 'resignation' | 'doc';

export interface DeleteModalState {
  isOpen: boolean;
  type: DeleteItemType | null;
  index: number | null;
  itemName?: string;
}

export interface EmployeeTabProps {
  employee: any;
  hasPermission: (permission: string) => boolean;
  updateEmployeeAPI: (data: any, successMessage?: string) => Promise<void>;
  setPdfPreviewUrl: (url: string | null) => void;
  setDeleteModal: (modal: DeleteModalState) => void;
}
