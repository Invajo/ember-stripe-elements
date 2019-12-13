/* global Stripe */
import Service from '@ember/service';
import { getProperties, setProperties } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { resolve } from 'rsvp';
import loadScript from 'ember-stripe-elements/utils/load-script';
import EmberError from '@ember/error';

// As listed at https://stripe.com/docs/stripe-js/reference#the-stripe-object
const STRIPE_FUNCTIONS = [
  'elements',
  'createToken',
  'createSource',
  'createPaymentMethod',
  'retrieveSource',
  'paymentRequest',
  'redirectToCheckout',
  'retrievePaymentIntent',
  'handleCardPayment',
  'handleCardAction',
  'confirmPaymentIntent',
  'handleCardSetup',
  'confirmCardSetup',
  'retrieveSetupIntent',
  'confirmSetupIntent',
  'confirmCardPayment'
];

export default Service.extend({
  config: null,
  didConfigure: false,
  didLoad: false,

  lazyLoad: readOnly('config.lazyLoad'),
  mock: readOnly('config.mock'),
  publishableKey: null,
  stripeAccount: null,

  init() {
    this._super(...arguments);
    
    this.setProperties({
      publishableKey: this.get('config.publishableKey'),
      stripeAccount: this.get('config.stripeAccount')
    })

    let lazyLoad = this.get('lazyLoad');

    if (!lazyLoad) {
      this.configure();
    }
  },

  load(publishableKey = null, stripeAccount = null) {
    if (publishableKey) {
      this.setProperties({
        publishableKey,
        stripeAccount
      });
    }

    let lazyLoad = this.get('lazyLoad');
    let mock = this.get('mock');
    let shouldLoad = lazyLoad && !mock

    let doLoad = shouldLoad ? loadScript("https://js.stripe.com/v3/") : resolve();

    return doLoad.then(() => {
      this.configure();
      this.set('didLoad', true);
    });
  },

  configure() {
    let didConfigure = this.get('didConfigure');

    if (!didConfigure) {

      let { publishableKey, stripeAccount } = this.getProperties('publishableKey', 'stripeAccount');

      if (!publishableKey) {
        throw new EmberError("stripev3: Missing Stripe key, please set `ENV.stripe.publishableKey` in config.environment.js");
      }

      let stripe = new Stripe(publishableKey, {
        stripeAccount
      });

      let functions = getProperties(stripe, STRIPE_FUNCTIONS);
      setProperties(this, functions);

      this.set('didConfigure', true);
    }
  }
});
