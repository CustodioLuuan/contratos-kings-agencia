import z from "zod";

export const ContractSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  client_name: z.string(),
  client_document: z.string(),
  client_email: z.string().nullable(),
  client_phone: z.string().nullable(),
  company_name: z.string().nullable(),
  contract_value: z.number(),
  payment_date: z.string(),
  contract_type: z.enum(['service', 'permuta']).default('service'),
  partner_services: z.string().nullable(),
  status: z.enum(['pending', 'signed']),
  signature_link_token: z.string().nullable(),
  signature_data: z.string().nullable(),
  signed_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Contract = z.infer<typeof ContractSchema>;

export const CreateContractSchema = z.object({
  client_name: z.string().min(1, "Nome do cliente é obrigatório"),
  client_document: z.string().min(11, "CPF ou CNPJ é obrigatório"),
  client_email: z.string().email("Email inválido").optional(),
  client_phone: z.string().optional(),
  company_name: z.string().optional(),
  contract_value: z.number().positive("Valor deve ser maior que zero"),
  payment_date: z.string().min(1, "Data de pagamento é obrigatória"),
  contract_type: z.enum(['service', 'permuta']).default('service'),
  partner_services: z.string().optional(),
});

export type CreateContract = z.infer<typeof CreateContractSchema>;
