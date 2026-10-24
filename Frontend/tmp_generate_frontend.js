import fs from 'fs';
import path from 'path';

const modules = [
    { name: 'client-service', prefix: 'clientService', model: 'ClientService', endpoint: '/master/client-service' },
    { name: 'department', prefix: 'department', model: 'Department', endpoint: '/master/department' },
    { name: 'labour-service', prefix: 'labourService', model: 'LabourService', endpoint: '/master/labour-service' },
    { name: 'payment-category', prefix: 'paymentCategory', model: 'PaymentCategory', endpoint: '/master/payment-category' },
    { name: 'vendor', prefix: 'vendor', model: 'Vendor', endpoint: '/master/vendor' },
    { name: 'room', prefix: 'room', model: 'Room', endpoint: '/master/room' }
];

const basePath = path.join('e:/Akash/Web_project/Artibots/ERP_@/Frontend/src/features/master/services');

if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

modules.forEach(mod => {
    const pascalName = capitalizeFirstLetter(mod.prefix);

    const content = `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api';

export interface ${pascalName} {
    id: string;
    code: string;
    status: boolean;
    [key: string]: any;
}

export const ${mod.prefix}Service = {
    getAll: async (): Promise<${pascalName}[]> => {
        const res = await api.get('${mod.endpoint}');
        return res.data.data;
    },
    create: async (data: any): Promise<${pascalName}> => {
        const res = await api.post('${mod.endpoint}', data);
        return res.data.data;
    },
    update: async (id: string, data: any): Promise<${pascalName}> => {
        const res = await api.put(\`${mod.endpoint}/\${id}\`, data);
        return res.data.data;
    },
    delete: async (id: string): Promise<void> => {
        await api.delete(\`${mod.endpoint}/\${id}\`);
    }
};

export function use${pascalName}s() {
    return useQuery({
        queryKey: ['${mod.name}s'],
        queryFn: ${mod.prefix}Service.getAll
    });
}

export function useCreate${pascalName}() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ${mod.prefix}Service.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['${mod.name}s'] });
        }
    });
}

export function useUpdate${pascalName}() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => ${mod.prefix}Service.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['${mod.name}s'] });
        }
    });
}

export function useDelete${pascalName}() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ${mod.prefix}Service.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['${mod.name}s'] });
        }
    });
}
`;
    fs.writeFileSync(path.join(basePath, `${mod.name}.ts`), content);
});

console.log('Successfully generated all frontend master hooks.');
