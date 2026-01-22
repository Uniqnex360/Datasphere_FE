import { useState, useCallback } from 'react';
import { MasterAPI } from '../lib/api';

interface UseMasterDataOptions<T> {
    entityName: string;
    getApiMethod: () => Promise<T[]>;
    checkReferences?: (item: T) => Promise<boolean>;
    getItemName: (item: T) => string;
    getItemCode: (item: T) => string;
}

export function useMasterData<T>({
    entityName,
    getApiMethod,
    checkReferences,
    getItemName,
    getItemCode,
}: UseMasterDataOptions<T>) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getApiMethod();
            setData(result || []);
        } catch (error: any) {
            setToast({
                message: `Failed to load ${entityName}: ${error.message}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    }, [entityName, getApiMethod]);

    const updateItem = useCallback(async (item: T, updateData: Partial<T>) => {
        try {
            const itemCode = getItemCode(item);
            const itemName = getItemName(item);

            await MasterAPI.update(entityName, itemCode, updateData);

            setToast({
                message: `${itemName} updated successfully`,
                type: 'success'
            });

            await loadData();
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                'Update failed';

            setToast({
                message: `Failed to update: ${errorMessage}`,
                type: 'error'
            });
            return false;
        }
    }, [entityName, getItemCode, getItemName, loadData]);

    const deleteItem = useCallback(async (item: T) => {
        try {
            const itemCode = getItemCode(item);
            const itemName = getItemName(item);

            if (checkReferences) {
                const hasReferences = await checkReferences(item);
                if (hasReferences) {
                    setToast({
                        message: `Cannot delete ${itemName}. It is linked to other records.`,
                        type: 'error',
                    });
                    return false;
                }
            }

            await MasterAPI.delete(entityName, itemCode);

            setToast({
                message: `${itemName} deleted successfully`,
                type: 'success'
            });

            await loadData();
            return true;
        } catch (error: any) {
            const errorMessage = error.response?.data?.detail ||
                error.response?.data?.message ||
                error.message ||
                'Delete failed';

            setToast({
                message: `Failed to delete: ${errorMessage}`,
                type: 'error'
            });
            return false;
        }
    }, [entityName, getItemCode, getItemName, checkReferences, loadData]);

    return {
        data,
        loading,
        toast,
        setToast,
        loadData,
        updateItem,
        deleteItem,
    };
}