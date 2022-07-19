import { IgoPage } from './app.po';
import {} from 'jasmine';

describe('igo App', () => {
  let page: IgoPage;

  beforeEach(() => {
    page = new IgoPage();
  });

  it('should have header div', () => {
    page.navigateTo();
    expect(page.getHeaderDiv().isPresent()).toBeTruthy();
  });

  it('should have Menu div', () => {
    page.navigateTo();
    expect(page.getMenuDiv().isPresent()).toBeTruthy();
  });

  // it('should display placeholder in search bar', () => {
  //   page.navigateTo();
  //   expect(page.getSearchBarInput().getAttribute('placeholder'))
  //   .toEqual('Search for an address or a place');
  // });

});
