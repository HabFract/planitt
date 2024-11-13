import React from "react";
import { StoryFn, Meta, StoryObj } from "@storybook/react";
import SystemCalendarCard, { SystemCalendarProps } from "./SystemCalendarCard";
import { DateTime } from "luxon";
import { Default as CalendarDefault } from "../controls/Calendar.stories";

export default {
  title: "Components/Cards/SystemCalendarCard",
  component: SystemCalendarCard,
} as Meta<SystemCalendarProps>;

const Template: StoryFn<SystemCalendarProps> = (args) => <SystemCalendarCard {...args} />;

type Story = StoryObj<SystemCalendarProps>;

export const Default: Story = Template.bind({});
Default.args = {
  ...CalendarDefault.args,
  sphere: {
    eH: "",
    id: "SGVhbHRoMQ==",
    name: "Health & Fitness",
    metadata: {
      description: "Focus on physical health, exercise, and nutrition.",
      hashtag: "fitness exercise nutrition",
      image: " data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iNTIiIHZpZXdCb3g9IjAgMCA1MiA1MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjYiIGN5PSIyNiIgcj0iMjYiIGZpbGw9IiMyMTMyMzAiLz4KPHBhdGggZD0iTTM2Ljk4NTcgMzIuOTM0NEgzMS40OTk0QzMxLjAyOCAzMi45MzU5IDMwLjU2MSAzMi44NDM4IDMwLjEyNTUgMzIuNjYzNkMyOS42ODk5IDMyLjQ4MzQgMjkuMjk0NCAzMi4yMTg1IDI4Ljk2MTkgMzEuODg0NEMyOC40ODk5IDMxLjQxMTUgMjIuMzMzIDI1LjI1ODQgMjIuMDk3NSAyNS4wMTU2TDE2LjU3MTkgMTkuNDlDMTYuNDg3MyAxOS40MTE5IDE2LjM3NjQgMTkuMzY4NiAxNi4yNjEzIDE5LjM2ODZDMTYuMTQ2MiAxOS4zNjg2IDE2LjAzNTMgMTkuNDExOSAxNS45NTA3IDE5LjQ5TDE0LjE3NDQgMjEuMjcwNkMxMy45MDQxIDIxLjU0MTkgMTMuNzUyMyAyMS45MDkyIDEzLjc1MjMgMjIuMjkyMkMxMy43NTIzIDIyLjY3NTEgMTMuOTA0MSAyMy4wNDI1IDE0LjE3NDQgMjMuMzEzOEwyNi44ODgyIDM2LjAyMzFDMjcuMDQyOCAzNi4xODAzIDI3LjIwOTYgMzYuMzI1MiAyNy4zODY5IDM2LjQ1NjNDMjguMTU0MiAzNy4wMjczIDI5LjA4NiAzNy4zMzQ0IDMwLjA0MjUgMzcuMzMxM0gzNS44QzM2LjQ0OTcgMzcuMzMwOCAzNy4wNzI2IDM3LjA3MjYgMzcuNTMyIDM2LjYxMzJDMzcuOTkxNCAzNi4xNTM4IDM4LjI0OTYgMzUuNTMwOSAzOC4yNSAzNC44ODEzVjM0LjIxNjNDMzguMjUwNSAzMy44NzkxIDM4LjExOCAzMy41NTU0IDM3Ljg4MTMgMzMuMzE1NEMzNy42NDQ2IDMzLjA3NTQgMzcuMzIyNyAzMi45Mzg1IDM2Ljk4NTcgMzIuOTM0NFoiIGZpbGw9IiMwMkIxOTciLz4KPHBhdGggZD0iTTIyLjcxNDQgMjQuMzk4OEwyMi45OTQ0IDI0LjY3ODhDMjMuMDkwNyAyMy4xNzIyIDIzLjMzNTkgMTkuNTgyMSAyMy40Mjc1IDE4LjEyNUwyMy41MTk0IDE2Ljc0NjlDMjMuNTQxNCAxNi4zNTM3IDIzLjQ0NCAxNS45NjMgMjMuMjQgMTUuNjI2MUMyMy4wMzYxIDE1LjI4OTMgMjIuNzM1IDE1LjAyMTkgMjIuMzc2NCAxNC44NTkyQzIyLjAxNzggMTQuNjk2NCAyMS42MTg0IDE0LjY0NTkgMjEuMjMwNSAxNC43MTQyQzIwLjg0MjcgMTQuNzgyNSAyMC40ODQ1IDE0Ljk2NjUgMjAuMjAzMSAxNS4yNDE5TDE2LjgyNTYgMTguNjE5NEMxNi45NTk1IDE4LjY3NzggMTcuMDgxMiAxOC43NjA5IDE3LjE4NDQgMTguODY0NEwyMi43MTQ0IDI0LjM5ODhaIiBmaWxsPSIjMDJCMTk3Ii8+CjxwYXRoIGQ9Ik0zMS40OTk0IDMyLjA1OTRIMzYuMTc2M0MzNC40NTMyIDMwLjEwOTQgMzMuMDY3NyAyNy44ODU1IDMyLjA3NjkgMjUuNDc5NEMzMS42OTg0IDI1Ljg2MjQgMzAuODc3MiAyNi42NzU3IDMwLjQ5MzEgMjcuMDYzMUMzMC40MTA2IDI3LjE0NDQgMzAuMjk5MyAyNy4xODk3IDMwLjE4MzUgMjcuMTg5QzMwLjA2NzcgMjcuMTg4NCAyOS45NTY5IDI3LjE0MTkgMjkuODc1MyAyNy4wNTk3QzI5Ljc5MzcgMjYuOTc3NiAyOS43NDggMjYuODY2NCAyOS43NDgyIDI2Ljc1MDZDMjkuNzQ4MyAyNi42MzQ4IDI5Ljc5NDQgMjYuNTIzOCAyOS44NzYzIDI2LjQ0MTlMMzEuNzQgMjQuNTc4MUMzMS4zNjM4IDIzLjU0MTIgMzEuMDQ0NCAyMi42MjY5IDMwLjc3MzEgMjEuODM5NEMzMC4zMjI5IDIyLjI4OTYgMjguNzA5OCAyMy45MDI3IDI4LjIzMTMgMjQuMzgxMkMyOC4xOTEzIDI0LjQyMjggMjguMTQzNCAyNC40NTU4IDI4LjA5MDQgMjQuNDc4M0MyOC4wMzc0IDI0LjUwMDkgMjcuOTgwNCAyNC41MTI1IDI3LjkyMjggMjQuNTEyNUMyNy44NjUyIDI0LjUxMjUgMjcuODA4MiAyNC41MDA5IDI3Ljc1NTIgMjQuNDc4M0MyNy43MDIyIDI0LjQ1NTggMjcuNjU0MyAyNC40MjI4IDI3LjYxNDQgMjQuMzgxMkMyNy41NzM4IDI0LjM0MDggMjcuNTQxNiAyNC4yOTI3IDI3LjUxOTcgMjQuMjM5OEMyNy40OTc3IDI0LjE4NjggMjcuNDg2NCAyNC4xMzAxIDI3LjQ4NjQgMjQuMDcyOEMyNy40ODY0IDI0LjAxNTUgMjcuNDk3NyAyMy45NTg4IDI3LjUxOTcgMjMuOTA1OEMyNy41NDE2IDIzLjg1MjkgMjcuNTczOCAyMy44MDQ4IDI3LjYxNDQgMjMuNzY0NEMyOC4xMTY1IDIzLjI2MjMgMjkuOTk5MiAyMS4zNzk0IDMwLjQ2NjkgMjAuOTExOUMzMC4wMDA4IDE5LjQ3ODQgMjkuNzM5NyAxNy45ODM2IDI4LjAwMzcgMTcuOTU4OEMyNy42MDQyIDE3Ljk1OTQgMjcuMjEzNCAxOC4wNzU4IDI2Ljg3ODcgMTguMjk0QzI2LjU0NDEgMTguNTEyMiAyNi4yNzk5IDE4LjgyMjggMjYuMTE4MSAxOS4xODgxQzI1Ljg2MTYgMTkuODEzNiAyNS4xNzczIDE5Ljk0NCAyNC41NjA2IDE5Ljg4ODFDMjQuMzQ0NSAxOS45MTQxIDI0LjE0MTQgMTkuNzA2NyAyNC4xODAxIDIwLjAzMjVMMjQuMTc1NiAyMC4xMjQ0QzI0LjEyNjMgMjAuNzc5OCAyMy44NiAyNC45NDM0IDIzLjgxNjkgMjUuNTA1NkwyOS41Nzg4IDMxLjI2NzVDMjkuODMwNiAzMS41MTk5IDMwLjEzMDEgMzEuNzE5OSAzMC40NTk4IDMxLjg1NThDMzAuNzg5NCAzMS45OTE4IDMxLjE0MjggMzIuMDYwOSAzMS40OTk0IDMyLjA1OTRaIiBmaWxsPSIjMDJCMTk3Ii8+CjxwYXRoIGQ9Ik0yNi4yNzEzIDM2LjY0TDI2LjA4NzUgMzYuNDU2M0gxNC4xODc1QzE0LjA3MjcgMzYuNDU4IDEzLjk2MzEgMzYuNTA0OSAxMy44ODI1IDM2LjU4NjhDMTMuODAxOSAzNi42Njg2IDEzLjc1NjggMzYuNzc4OSAxMy43NTY4IDM2Ljg5MzhDMTMuNzU2OCAzNy4wMDg2IDEzLjgwMTkgMzcuMTE4OSAxMy44ODI1IDM3LjIwMDdDMTMuOTYzMSAzNy4yODI2IDE0LjA3MjcgMzcuMzI5NSAxNC4xODc1IDM3LjMzMTNIMjcuMTE1N0MyNi44MDc1IDM3LjEzNTYgMjYuNTI0IDM2LjkwMzUgMjYuMjcxMyAzNi42NFoiIGZpbGw9IiMwMkIxOTciLz4KPHBhdGggZD0iTTIwLjc1IDMzLjgxMDFDMjAuODY0NiAzMy44MDc4IDIwLjk3MzcgMzMuNzYwNyAyMS4wNTM5IDMzLjY3ODlDMjEuMTM0MSAzMy41OTcxIDIxLjE3OTEgMzMuNDg3MSAyMS4xNzkxIDMzLjM3MjVDMjEuMTc5MSAzMy4yNTggMjEuMTM0MSAzMy4xNDggMjEuMDUzOSAzMy4wNjYyQzIwLjk3MzcgMzIuOTg0NCAyMC44NjQ1IDMyLjkzNzMgMjAuNzUgMzIuOTM1MUgxNC4xODc1QzE0LjA3MyAzMi45MzczIDEzLjk2MzkgMzIuOTg0NCAxMy44ODM2IDMzLjA2NjJDMTMuODAzNCAzMy4xNDggMTMuNzU4NSAzMy4yNTggMTMuNzU4NSAzMy4zNzI2QzEzLjc1ODUgMzMuNDg3MiAxMy44MDM0IDMzLjU5NzIgMTMuODgzNyAzMy42NzlDMTMuOTYzOSAzMy43NjA4IDE0LjA3MyAzMy44MDc4IDE0LjE4NzYgMzMuODEwMUgyMC43NVoiIGZpbGw9IiMwMkIxOTciLz4KPC9zdmc+Cg=="
    },
  },
};

export const Nutrition: Story = Template.bind({});
Nutrition.args = {
  ...CalendarDefault.args,
  sphere: {
    eH: "",
    id: "SGVhbHRoMQ==",
    name: "Nutrition",
    metadata: {
      description: "Focus on physical health, exercise, and nutrition.",
      hashtag: "fitness exercise nutrition",
      image: " data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTIiIGhlaWdodD0iNTIiIHZpZXdCb3g9IjAgMCA1MiA1MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjYiIGN5PSIyNiIgcj0iMjYiIGZpbGw9IiMyMTMyMzAiLz4KPGcgY2xpcC1wYXRoPSJ1cmwoI2NsaXAwXzI0M18zNzcwKSI+CjxwYXRoIGQ9Ik0yNS43MjE3IDE5LjU4MzVDMjYuMTM5IDIwLjI2MTYgMjYuNDA5NyAyMS4wMjg5IDI2LjUwNjUgMjEuODI2OEwzMC4xNDEgMTcuNDQyNUMzMC43MzYgMTYuNzI0NSAzMS41NDk3IDE2LjIyNTIgMzIuNDQ2MSAxNi4wMTE5QzMxLjY0IDE0LjQ4MTIgMzAuMDM0NCAxMy40NDkyIDI4LjE4NzYgMTMuNDQ5MkMyNi44MTMyIDEzLjQ1NjcgMjUuNzAyNSAxMy43OTE4IDI0LjcxNDkgMTQuNDg3N0MyNS4zNTQyIDE1LjI2NzYgMjUuNzYyMiAxNi4xOTY3IDI1LjkwNDkgMTcuMjA0MUMyNi4wMTkyIDE4LjAxMjkgMjUuOTU1OCAxOC44MTk1IDI1LjcyMTcgMTkuNTgzNVoiIGZpbGw9IiMwMkIxOTciLz4KPHBhdGggZD0iTTEzLjAzMDggMjMuNjIxMUgyMC45NDUzTDE5LjI3NzMgMjEuOTM3M0gxNi4yMjk1QzE1Ljc4NTQgMjEuOTM3MyAxNS40MjU2IDIxLjU3NzQgMTUuNDI1NiAyMS4xMzM0QzE1LjQyNTYgMjAuNjg5MyAxNS43ODU0IDIwLjMyOTUgMTYuMjI5NSAyMC4zMjk1SDE3LjY2OTRMMTQuOTY3OSAxNy42MjczQzE0LjY1NCAxNy4zMTM0IDE0LjY1NCAxNi44MDQzIDE0Ljk2ODQgMTYuNDkwNEMxNS4yODIzIDE2LjE3NjUgMTUuNzkxNSAxNi4xNzY1IDE2LjEwNTQgMTYuNDkwNEwxOC44MDY0IDE5LjE5MlYxNy43NTJDMTguODA2NCAxNy4zMDggMTkuMTY2MiAxNi45NDgxIDE5LjYxMDMgMTYuOTQ4MUMyMC4wNTQ0IDE2Ljk0ODEgMjAuNDE0NyAxNy4zMDggMjAuNDE0NyAxNy43NTJWMjAuODAwM0wyMy4yNzkzIDIzLjYyMTFIMjQuNzQxMUMyNS4xMzU0IDIyLjMxMyAyNC44MTc2IDIwLjg0OSAyMy44NTAyIDE5LjgyMzZDMjQuNjU2OSAxOC4zMzgzIDI0LjQxNTEgMTYuNDY4IDIzLjE3NzYgMTUuMjMwNEMyMS45Mzk0IDEzLjk5MTcgMjAuMDcwOCAxMy43NSAxOC41ODYgMTQuNTU3MkMxNy4xMTM1IDEzLjEyMTggMTQuNjk2OSAxMy4xMDg2IDEzLjIxNTcgMTQuNTI0OUMxMi40NDYyIDE1LjI1MjggMTIuMDE0NyAxNi4yMzY2IDEyLjAwMDUgMTcuMjkzOEMxMS45ODU4IDE4LjMzMTIgMTIuMzc0NiAxOS4zMDc5IDEzLjA5NDMgMjAuMDQ4OUMxMi40ODY3IDIxLjE2NjcgMTIuNDczIDIyLjUwMTYgMTMuMDMwOCAyMy42MjExWiIgZmlsbD0iIzAyQjE5NyIvPgo8cGF0aCBkPSJNMzEuNDA0MyAxOC40ODkyTDI3LjE1MDIgMjMuNjIxMUgzNi4zOTUyTDM2LjQ3MjMgMjMuNTU3MUMzNy4wNDA1IDIzLjA4NTcgMzcuMzg2MSAyMi4zOTIzIDM3LjQyMDYgMjEuNjU0NUMzNy40NTExIDIxLjAwMDggMzcuMjM0MyAyMC4zNTk4IDM2LjgyMTYgMTkuODU4OEMzNy44NjA2IDE5LjUwMDggMzguODczMiAxOS43OTAyIDM4LjkzODggMTkuODA5OEMzOS4zNzA1IDE5Ljk0MjIgMzkuODI4NCAxOS43MDEyIDM5Ljk2MjcgMTkuMjY5NkM0MC4wOTc1IDE4LjgzNzEgMzkuODU2IDE4LjM3NzIgMzkuNDIzNSAxOC4yNDI1QzM5LjM1MTggMTguMjIwMiAzOC4yNzA5IDE3Ljg5NTMgMzYuOTg1NCAxOC4xMjYzQzM3LjIxNjQgMTYuODQwNyAzNi44OTE1IDE1Ljc1OTcgMzYuODY5MiAxNS42ODc5QzM2LjczNDUgMTUuMjU1NCAzNi4yNzQxIDE1LjAxMTkgMzUuODQxNCAxNS4xNDY2QzM1LjQwODkgMTUuMjgxMyAzNS4xNjY4IDE1LjczOTIgMzUuMzAxNSAxNi4xNzE3QzM1LjMxODYgMTYuMjI4OSAzNS42MTAxIDE3LjIzODUgMzUuMjU2OSAxOC4yNzhDMzQuNzM2OCAxNy43NzU2IDM0LjAyOTUgMTcuNTA2NyAzMy4zMDU5IDE3LjU0MDVDMzIuNTY4MSAxNy41NzU0IDMxLjg3NTIgMTcuOTIxIDMxLjQwNDMgMTguNDg5MloiIGZpbGw9IiMwMkIxOTciLz4KPHBhdGggZD0iTTM5LjE3OTMgMjUuMjYxN0gxMi44MjAzQzEyLjM2NzUgMjUuMjYxNyAxMiAyNS41OTg0IDEyIDI2LjAxMjdDMTIgMjkuMjg3NCAxMy4zOTQgMzIuMzY1NiAxNS45MjQ0IDM0LjY4MTFDMTYuMTQ4IDM0Ljg4NTggMTYuMzc3NyAzNS4wODE5IDE2LjYxNCAzNS4yNjk1SDM1LjM4NTVDMzUuNjIxOCAzNS4wODE5IDM1Ljg1MTUgMzQuODg1OCAzNi4wNzUxIDM0LjY4MTFDMzguNjA1NSAzMi4zNjU2IDM5Ljk5OTUgMjkuMjg3NCAzOS45OTk1IDI2LjAxMjJDMzkuOTk5NiAyNS41OTc5IDM5LjYzMjEgMjUuMjYxNyAzOS4xNzkzIDI1LjI2MTdaIiBmaWxsPSIjMDJCMTk3Ii8+CjxwYXRoIGQ9Ik0zNi4xMTcgMzYuOTEwMkgxNS44ODI3QzE1LjQyOTkgMzYuOTEwMiAxNS4wNjI0IDM3LjI3NzcgMTUuMDYyNCAzNy43MzA1QzE1LjA2MjQgMzguMTgzMyAxNS40Mjk5IDM4LjU1MDggMTUuODgyNyAzOC41NTA4SDM2LjExN0MzNi41Njk4IDM4LjU1MDggMzYuOTM3MyAzOC4xODMzIDM2LjkzNzMgMzcuNzMwNUMzNi45MzczIDM3LjI3NzcgMzYuNTY5OCAzNi45MTAyIDM2LjExNyAzNi45MTAyWiIgZmlsbD0iIzAyQjE5NyIvPgo8L2c+CjxkZWZzPgo8Y2xpcFBhdGggaWQ9ImNsaXAwXzI0M18zNzcwIj4KPHJlY3Qgd2lkdGg9IjI4IiBoZWlnaHQ9IjI4IiBmaWxsPSJ3aGl0ZSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTIgMTIpIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg=="
    },
  },
};