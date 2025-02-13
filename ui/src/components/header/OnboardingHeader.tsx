import { getIconSvg, HeaderAction, ProgressBar } from "habit-fract-design-system";
import { currentOrbitIdAtom } from "../../state/orbit";

import { store } from "../../state/store";
import { ForwardedRef, forwardRef, RefObject } from "react";
import { isSmallScreen } from "../vis/helpers";
import { currentSphereHashesAtom } from "../../state/sphere";
import { MODEL_DISPLAY_VALUES, ONBOARDING_FORM_TITLES } from "../../constants";
import { useStateTransition } from "../../hooks/useStateTransition";

/**
 * Header component for the onboarding flow
 * Displays progress bar and navigation controls during onboarding
 * 
 * @component
 * @param {ForwardedRef<HTMLDivElement>} ref - Forwarded ref for the progress bar container
 * @returns {JSX.Element | null} Rendered component or empty fragment if not in onboarding state
 */
const OnboardingHeader: React.ForwardRefExoticComponent<
  React.PropsWithoutRef<{}>
> = forwardRef<HTMLDivElement, {}>(
  ({}, ref: ForwardedRef<HTMLDivElement>) => {
    const [state, transition, params] = useStateTransition(); // Top level state machine and routing
    if (!state.match("Onboarding")) return <></>;
    const returningUser = !!params?.spin; // Indicates if the onboarding flow has previously been gone through

    /**
     * Handles the back action in the onboarding flow
     * Determines the previous state and required props based on current state
     * 
     * @returns {void}
     */
    const handleBackAction = () => {
      const sphere = store.get(currentSphereHashesAtom);
      const orbit = store.get(currentOrbitIdAtom);
      const props = getLastOnboardingState(state).match("Onboarding1")
        ? { sphereToEditId: sphere?.actionHash }
        : getLastOnboardingState(state).match("Onboarding2")
          ? { sphereEh: sphere.entryHash, orbitToEditId: orbit?.id }
          : { orbitToEditId: orbit?.id };

      return transition(getLastOnboardingState(state), {
        editMode: true,
        ...props,
        ...params
      });
    };

    const currentStepNumber = +(state.match(/Onboarding(\d+)/)?.[1] || 0);

    return (
      <header className={returningUser ? "returning-user" : "new-user"}>
        <HeaderAction
          title={`Put a Plan in Motion`}
          icon1={getIconSvg('back')}
          icon2={null}
          handlePrimaryAction={handleBackAction}
        />
        <div ref={ref}>
          <ProgressBar
            stepNames={
              !returningUser ? [
                "Create Password",
                `Create a ${MODEL_DISPLAY_VALUES['sphere']}`,
                `Create a ${MODEL_DISPLAY_VALUES['orbit']}`,
                `Break Up ${MODEL_DISPLAY_VALUES['orbit']}`,
                "Visualise",
              ] : [`Create a ${MODEL_DISPLAY_VALUES['sphere']}`,
                `Create a ${MODEL_DISPLAY_VALUES['orbit']}`,
                `Break Up ${MODEL_DISPLAY_VALUES['orbit']}`,
                "Visualise",
              ]}
            currentStep={returningUser ? currentStepNumber - 1 : currentStepNumber}
          />
        </div>
        <h1 className={"onboarding-title"}>{ONBOARDING_FORM_TITLES[currentStepNumber - 1]}</h1>
      </header>
    );
  },
);

/**
 * Gets the previous onboarding state based on current state
 * 
 * @param {string} state - Current onboarding state
 * @returns {string} Previous state identifier
 */
function getLastOnboardingState(state: string) {
  if (state == "Onboarding1" || state.match(/Onboarding(\d+)/) == null)
    return "Home";
  return `Onboarding${+state.match(/Onboarding(\d+)/)![1] - 1}`;
}

/**
 * Gets the next onboarding state based on current state
 * 
 * @param {string} state - Current onboarding state
 * @returns {string} Next state identifier
 */
const getNextOnboardingState = (state: string) => {
  if (state.match(/Onboarding(\d+)/) == null) return "Home";
  if (state == "Onboarding3") return "Vis";
  return `Onboarding${+state.match(/Onboarding(\d+)/)![1] + 1}`;
};

export { getNextOnboardingState };

export default OnboardingHeader;
