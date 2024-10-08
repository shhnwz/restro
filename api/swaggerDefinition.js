export const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
      title: 'Restaurant API',
      version: '1.0.0',
      description: 'API documentation for a generic restaurant system',
    },
    components: {
      schemas: {
        User: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
            },
            email: {
              type: 'string',
            },
            password: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['customer', 'admin', 'staff'],
            },
            phone: {
              type: 'string',
            },
            address: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  street: { type: 'string' },
                  city: { type: 'string' },
                  state: { type: 'string' },
                  zip: { type: 'string' },
                },
              },
            },
          },
        },
        MenuItem: {
          type: 'object',
          required: ['name', 'price', 'category', 'image'],
          properties: {
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
            price: {
              type: 'number',
            },
            category: {
              type: 'string',
            },
            available: {
              type: 'boolean',
            },
            image: {
              type: 'object',
              properties: {
                public_id: {
                  type: 'string',
                },
                url: {
                  type: 'string',
                },
              },
            },
          },
        },
        Order: {
          type: 'object',
          required: ['user', 'items', 'totalAmount', 'paymentMethod'],
          properties: {
            user: {
              type: 'string',
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  menuItemId: { type: 'string' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                },
              },
            },
            totalAmount: {
              type: 'number',
            },
            status: {
              type: 'string',
              enum: ['pending', 'preparing', 'delivered', 'canceled'],
            },
            paymentMethod: {
              type: 'string',
              enum: ['card', 'cash'],
            },
            deliveryAddress: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip: { type: 'string' },
              },
            },
            dineIn: {
              type: 'boolean',
            },
          },
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
            },
            description: {
              type: 'string',
            },
          },
        },
        Review: {
          type: 'object',
          required: ['user', 'menuItem', 'rating'],
          properties: {
            user: {
              type: 'string',
            },
            menuItem: {
              type: 'string',
            },
            rating: {
              type: 'number',
              minimum: 1,
              maximum: 5,
            },
            comment: {
              type: 'string',
            },
          },
        },
      },
    },
    paths: {
      '/api/menuitems': {
        get: {
          summary: 'Get all menu items',
          tags: ['MenuItems'],
          responses: {
            200: {
              description: 'List of all menu items',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MenuItem' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new menu item',
          tags: ['MenuItems'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' },
              },
            },
          },
          responses: {
            201: {
              description: 'Menu item created successfully',
            },
          },
        },
      },
      '/api/menuitems/{id}': {
        get: {
          summary: 'Get a specific menu item by ID',
          tags: ['MenuItems'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'Menu item ID',
            },
          ],
          responses: {
            200: {
              description: 'The menu item data',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/MenuItem' },
                },
              },
            },
            404: {
              description: 'Menu item not found',
            },
          },
        },
        put: {
          summary: 'Update a menu item',
          tags: ['MenuItems'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'Menu item ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/MenuItem' },
              },
            },
          },
          responses: {
            200: {
              description: 'Menu item updated successfully',
            },
          },
        },
        delete: {
          summary: 'Delete a menu item',
          tags: ['MenuItems'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'Menu item ID',
            },
          ],
          responses: {
            200: {
              description: 'Menu item deleted successfully',
            },
            404: {
              description: 'Menu item not found',
            },
          },
        },
      },
      '/api/orders': {
        post: {
          summary: 'Place a new order',
          tags: ['Orders'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Order' },
              },
            },
          },
          responses: {
            201: {
              description: 'Order placed successfully',
            },
          },
        },
      },
      '/api/orders/{id}': {
        get: {
          summary: 'Get a specific order by ID',
          tags: ['Orders'],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: {
                type: 'string',
              },
              description: 'Order ID',
            },
          ],
          responses: {
            200: {
              description: 'Order details',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' },
                },
              },
            },
            404: {
              description: 'Order not found',
            },
          },
        },
      },
      '/api/categories': {
        get: {
          summary: 'Get all categories',
          tags: ['Categories'],
          responses: {
            200: {
              description: 'List of all categories',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: 'Create a new category',
          tags: ['Categories'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Category' },
              },
            },
          },
          responses: {
            201: {
              description: 'Category created successfully',
            },
          },
        },
      },
      '/api/reviews': {
        post: {
          summary: 'Create a review for a menu item',
          tags: ['Reviews'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Review' },
              },
            },
          },
          responses: {
            201: {
              description: 'Review created successfully',
            },
          },
        },
      },
    },
  }
