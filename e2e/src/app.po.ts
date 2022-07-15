import { browser, element, by } from 'protractor';

export class IgoPage {
  navigateTo() {
    return browser.get('/');
  }

  getMenuDiv() {
    return element(by.css('app-menu'));
  }

  getHeaderDiv() {
    return element(by.css('app-header'));
  }

  getFooterDiv() {
    return element(by.css('app-footer'));
  }

  getAppPortalDiv() {
    return element(by.css('app-portal'));
  }

  getSearchBarInput() {
    return element(by.css('app-portal igo-search-bar input'));
  }

}
