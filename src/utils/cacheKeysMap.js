
function keyFor(initialKey) {
  const cacheKeyGenFn = (appId = 1, entityID, userID = undefined) => {
    if (undefined === userID || entityID == userID) {
      return `app:${appId}:${initialKey}:${entityID}` ;
    } else {
      return `app:${appId}:u:${userID}:${initialKey}:${entityID}` ;
    }
  }; 
  return cacheKeyGenFn;
}

export const cacheKey = {
  user: keyFor('u'),
  profile: keyFor('profile'),
  paymentMethod: keyFor('pm'),
  paymentConfig: keyFor('pc'),
  role: keyFor('role'),
  userPreference: keyFor('preference'),
  organization: keyFor('org'),
  userOrganization: keyFor('uorg'),
  termsAndConditions: keyFor('tac'),
  faqOrganization: keyFor('faq:org'),
  organizationMedia: keyFor('org:media'),
  industry: keyFor('industry'),
  tagOrganization: keyFor('tag:org'),
  topicOrganization: keyFor('topic:org'),
  service: keyFor('s'),
  criteria: keyFor('criteria'),
  asset: keyFor('a'),
  serviceAsset: keyFor('s:a'),
  serviceMedia: keyFor('s:media'),
  faqAnswer: keyFor('faq:answer'),
  faqQuestion: keyFor('faq:question'),
  faqService: keyFor('faq:s'),
  serviceAttribute: keyFor('s:attr'),
  topic: keyFor('topic'),
  tag: keyFor('tag'),
  receipt:keyFor('r'),
  invoice: keyFor('i'),
  reversal: keyFor('rev'),
  estimate: keyFor('e'),
  transaction: keyFor('t'),
  estimateAsset: keyFor('e:asset'),
  notification: keyFor('n'),
  notificationTemplate: keyFor('n:template'),
  template: keyFor('template'),
  reviewComment:keyFor('rc'), 
  comment: keyFor('c'),
  review: keyFor('review'),
  application: keyFor('app'),
  applicationToken: keyFor('appt'),
  userToken: keyFor('ut'),
  authZ: keyFor('authz'),
  authN: keyFor('authn'),
  recommender: keyFor('rec'),
  resetPasswordToken: keyFor('rpwsd'),
  member: keyFor('member'),
  message: keyFor('msg'),
  media: keyFor('media'), 
  contract: keyFor('contract'),
  audit: keyFor('audit'),
  analytic: keyFor('ana'),
  joint: keyFor('joint')
};


Object.freeze(cacheKey);

