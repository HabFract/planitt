
import './App.css'

import { useStateTransition } from './hooks/useStateTransition';

import Steps from '../../design-system/onboarding/ProgressBar';
import Button from '../../design-system/buttons/Button';
import Nav from './components/Nav';
import { CustomFlowbiteTheme, Flowbite } from 'flowbite-react';
import { cloneElement, useState } from 'react';
import BackCaret from './components/icons/BackCaret';
import Onboarding from './components/layouts/Onboarding';
import darkTheme from '../../design-system/darkTheme';

function getLastOnboardingState(state: string) {
  if (state == 'Onboarding1') return 'Home';
  return `Onboarding${+(state.match(/Onboarding(\d+)/)![1]) - 1}`
};
function getNextOnboardingState(state: string) {
  if (state == 'Onboarding4') return 'Home';
  return `Onboarding${+(state.match(/Onboarding(\d+)/)![1]) + 1}`
};

function App({ children: pageComponent }: any) {
  const [state, transition] = useStateTransition(); // Top level state machine and routing
  const [sideNavExpanded, setSideNavExpanded] = useState<boolean>(false); // Adds and removes expanded class to side-nav

  const customTheme: CustomFlowbiteTheme = {
    // label: {
    //   root: {
    //     base: "text-base font-sans font-semibold tracking-wide leading-[1.5rem] flex items-center gap-2",
    //     colors: {
    //       default: "text-title",
    //       disabled: "text-slate-50",
    //     }
    //   }
    // },
    dropdown: {
      content: "",
      inlineWrapper: "bg-primary text-base font-sans font-semibold tracking-wide leading-[1.5rem] flex items-center gap-2"
    },
    textInput: {
      field: {
        input: {
          colors: {
            default: "text-base bg-slate-800 hover:bg-slate-700 text-title border-slate-500 border-2 focus:border-transparent focus:outline-link focus:outline-offset-2 focus:outline-2 focus:shadow-[0_35px_60px_-15px_rgba(0,0,0,0)] focus:ring-0",
            valid: "dark:bg-secondary ",
            invalid: "dark:bg-secondary ",
            disabled: "text-base bg-slate-800 hover:bg-slate-800 text-title border-slate-500 border-2 focus:border-transparent focus:outline-link focus:outline-offset-2 focus:outline-2 focus:shadow-[0_35px_60px_-15px_rgba(0,0,0,0)] focus:ring-0",
          }
        }
      }
    },
    textarea: {
      colors: {
        default: "p-4 text-base bg-slate-800 hover:bg-slate-700 text-title border-slate-500 border-2 focus:border-transparent  focus:outline-link focus:outline-offset-2 focus:outline-2 focus:shadow-[0_35px_60px_-15px_rgba(0,0,0,0)] focus:ring-0",
      }
    },
    select: {
      field: {
        select: {
          colors: {
            default: "p-4 text-base bg-slate-800 hover:bg-slate-700 text-title border-slate-500 border-2 focus:border-transparent  focus:outline-link focus:outline-offset-2 focus:outline-2 focus:shadow-[0_35px_60px_-15px_rgba(0,0,0,0)] focus:ring-0",
          }
        }
      }
    },
    tooltip: {
      style: {
        dark: "bg-white"
      }
    },
    button: {
      disabled: "opacity-1 "
    },
    modal: {
      header: {
        title: 'text-2xl text-title font-heading font-base tracking-wider leading-[1.5rem]'
      },
      content: {
        inner: 'border-2 border-title bg-bg rounded-xl text-base text-title'
      },
    },

  };
  return (
    <Flowbite>
      {state.match('Onboarding')
        ? <main className={"page-container onboarding-page"}>
          <Onboarding stage={state.match(/Onboarding(\d+)/)[1]}>
            <Steps
              stepNames={['Create Profile', 'Create A Sphere', 'Create An Orbit', 'Confirm Orbit', 'Visualize']}
              currentStep={state.match(/Onboarding(\d+)/)[1]}
            />
            <Button
              type={"secondary"}
              icon={<BackCaret />}
              onClick={() => transition(getLastOnboardingState(state))}>
            </Button>

            {cloneElement(pageComponent, {
              children: [cloneElement(pageComponent.props.children, {
                submitBtn:
                  <Button
                    type={"onboarding"}
                    onClick={() => transition(getNextOnboardingState(state))}>Save & Continue</Button>
              })]
            })}

          </Onboarding>
        </main>
        : <>
          <Nav transition={transition} sideNavExpanded={sideNavExpanded} setSideNavExpanded={setSideNavExpanded}></Nav>
          <main className={"page-container"}>{pageComponent}</main>
        </>
      }

    </Flowbite>
  )
}

export default App
