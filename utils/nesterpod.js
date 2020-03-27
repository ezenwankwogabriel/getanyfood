const axios = require('axios');

async function sentToNester(order, jobCost) {
  try {
    const {
      items,
      customer,
      merchant,
      delivery: { location },
      reference,
    } = order;
    const {
      NESTER_SERVER: api,
      ECOMMERCE_TOKEN_NESTERPOD: token,
    } = process.env;
    const details = {
      website_type: 'Getany',
      order_id: reference,
      sender_name: merchant.fullName,
      sender_email: merchant.emailAddress,
      sender_phone: merchant.phoneNumber,
      package_type: items[0] && items[0].product && items[0].product.type,
      package_description:
        items[0] && items[0].product && items[0].product.name,
      jobName: merchant.businessName,
      jobCost,
      pickup_contact_name: merchant.businessName,
      pickup_phone: merchant.phoneNumber,
      pickup_email: merchant.emailAddress,
      pickup_address: merchant.businessAddress,
      pickup_address_longitude: merchant.businessAddressLongitude || 0,
      pickup_address_latitude: merchant.businessAddressLatitude || 0,
      recipient_contact_name: customer.fullName,
      recipient_phone: customer.phoneNumber,
      recipient_email: customer.emailAddress,
      recipient_address: location && location.address,
      recipient_address_latitude: location && location.lat ? location.lat : 0,
      recipient_address_longitude: location && location.lng ? location.lng : 0,
    };
    const config = {
      headers: { Authorization: `JWT ${token}` },
    };
    const { data } = await axios.post(`${api}/jobs/website`, details, config);
    if (data.status) return true;
    throw new Error(data.message);
  } catch (ex) {
    throw new Error(ex.message);
  }
}

module.exports = sentToNester;
