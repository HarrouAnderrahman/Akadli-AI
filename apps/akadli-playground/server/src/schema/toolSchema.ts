import { OrderPayload } from '../../../shared/types.js';

export function buildFinalizeOrderToolSchema(order: OrderPayload) {
  // Extract and ensure non-empty enums
  const allowedSizes = order.constraints.allowed_sizes.length > 0
    ? order.constraints.allowed_sizes
    : [order.current_size];

  const allowedWilayas = order.constraints.allowed_wilayas.length > 0
    ? order.constraints.allowed_wilayas
    : [order.current_wilaya];

  const allowedCommunes = order.constraints.allowed_communes.length > 0
    ? order.constraints.allowed_communes
    : [order.current_commune];

  const jsonSchema = {
    name: 'finalize_order_decision',
    description:
      'Call this tool ONLY after the customer explicitly confirms the order, refuses/cancels it, or confirms their requested modifications to size or address.',
    parameters: {
      type: 'object',
      properties: {
        order_id: {
          type: 'string',
          description: 'The exact order ID from the confirmation request',
        },
        status: {
          type: 'string',
          enum: ['CONFIRMED', 'REFUSED', 'MODIFIED'],
          description:
            'CONFIRMED if kept as original, REFUSED if customer cancels, MODIFIED if size or address was modified',
        },
        final_size: {
          type: 'string',
          enum: allowedSizes,
          description: `The chosen size. Must be one of: ${allowedSizes.join(', ')}`,
        },
        final_wilaya: {
          type: 'string',
          enum: allowedWilayas,
          description: `The chosen Wilaya. Must be one of: ${allowedWilayas.join(', ')}`,
        },
        final_commune: {
          type: 'string',
          enum: allowedCommunes,
          description: `The chosen Commune. Must be one of: ${allowedCommunes.join(', ')}`,
        },
        final_address_note: {
          type: 'string',
          description:
            'Updated street, neighborhood, or delivery note if modified, otherwise original.',
        },
        modification_fields: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['size', 'wilaya', 'commune', 'address_note'],
          },
          description: 'List of fields that were modified during the conversation',
        },
        reason_or_notes: {
          type: 'string',
          description:
            'Brief summary in English or French of what the customer decided or reason for cancellation',
        },
      },
      required: [
        'order_id',
        'status',
        'final_size',
        'final_wilaya',
        'final_commune',
        'final_address_note',
        'modification_fields',
        'reason_or_notes',
      ],
    },
  };

  // Format tailored for Gemini Live / Multimodal Live API
  const geminiDeclaration = {
    name: 'finalize_order_decision',
    description: jsonSchema.description,
    parameters: {
      type: 'OBJECT',
      properties: {
        order_id: {
          type: 'STRING',
          description: jsonSchema.parameters.properties.order_id.description,
        },
        status: {
          type: 'STRING',
          enum: ['CONFIRMED', 'REFUSED', 'MODIFIED'],
          description: jsonSchema.parameters.properties.status.description,
        },
        final_size: {
          type: 'STRING',
          enum: allowedSizes,
          description: jsonSchema.parameters.properties.final_size.description,
        },
        final_wilaya: {
          type: 'STRING',
          enum: allowedWilayas,
          description: jsonSchema.parameters.properties.final_wilaya.description,
        },
        final_commune: {
          type: 'STRING',
          enum: allowedCommunes,
          description: jsonSchema.parameters.properties.final_commune.description,
        },
        final_address_note: {
          type: 'STRING',
          description: jsonSchema.parameters.properties.final_address_note.description,
        },
        modification_fields: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            enum: ['size', 'wilaya', 'commune', 'address_note'],
          },
          description: jsonSchema.parameters.properties.modification_fields.description,
        },
        reason_or_notes: {
          type: 'STRING',
          description: jsonSchema.parameters.properties.reason_or_notes.description,
        },
      },
      required: jsonSchema.parameters.required,
    },
  };

  return {
    jsonSchema,
    geminiDeclaration,
  };
}
