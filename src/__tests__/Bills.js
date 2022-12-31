/**
 * @jest-environment jsdom
 */

import "@testing-library/jest-dom"
import { screen, waitFor, fireEvent } from "@testing-library/dom"
import Bills from '../containers/Bills.js';
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH, ROUTES } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";

import router from "../app/Router.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //The classlist active-icon will higlight the icon
      expect(windowIcon).toHaveClass('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {

      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test('Then i click in the button new bill, the path "new bill" should be defined', () => {

      //Je prends l'élément du boutton qui permet de faire afficher le New bill
      const buttonNewBill = screen.getByTestId("btn-new-bill")

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const billsContainer = new Bills({
        document, onNavigate, store: null, bills: bills, localStorage: window.localStorage
      });

      document.body.innerHTML = BillsUI({ data: { bills } })

      const openNewBillPage = jest.fn(billsContainer.handleClickNewBill);

      buttonNewBill.addEventListener('click', openNewBillPage);
      fireEvent.click(buttonNewBill)
      
      expect(openNewBillPage).toHaveBeenCalled();
      expect(screen.getByTestId('form-new-bill')).toBeTruthy();
    })
  })
})
