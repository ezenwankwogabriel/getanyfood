
function userSubType(type) {
  let subType;
  switch (type) {
    case 'super_admin' || 'sub_admin': subType = 'sub_admin'; break;
    case 'merchant' || 'sub_merchant': subType = 'sub_merchant'; break;

    default:
      subType = 'sub_merchant'; break;
  }
  return subType;
}

module.exports = userSubType;
