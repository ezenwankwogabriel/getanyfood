/**
 * @swagger 
 * schema definition info goes here...
 */a/**
 * @swagger
 * definitions:
 *   CompanyPermission:
 *     properties:
 *       permission_id:
 *         type: integer
 *       user_id:
 *         type: integer
 *       enable:
 *         type: enum {'yes' , 'no'} default 'yes'
 *
 */
/**
 * @swagger
 * /companypermissions:
 *   get:
 *     tags:
 *       - Company Users Permission
 *     description: Returns all Company users permissions
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of Company users permissions
 *         schema:
 *           $ref: '#/definitions/CompanyPermission'
 */