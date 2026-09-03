<script>
  import TabBar from "./components/TabBar.svelte";
  import WeekView from "./views/WeekView.svelte";
  import TrainingView from "./views/TrainingView.svelte";
  import LineupView from "./views/LineupView.svelte";
  import ScheduleView from "./views/ScheduleView.svelte";
  import PresenceView from "./views/PresenceView.svelte";
  import PlayersView from "./views/PlayersView.svelte";
  import AnalysisView from "./views/AnalysisView.svelte";
  import LineupSheet from "./print/LineupSheet.svelte";
  import ScheduleSheet from "./print/ScheduleSheet.svelte";
  import { store, ladeKader, loadWeek, refreshSpielplan, goToTab } from "./lib/state.svelte.js";

  ladeKader();
  refreshSpielplan();
  loadWeek();

  const compMap = { anw: WeekView, training: TrainingView, auf: LineupView, plan: ScheduleView, pre: PresenceView, spl: PlayersView, ana: AnalysisView };

  const Active = $derived(compMap[store.activeTab]);
</script>

<div class="app">
  <Active />
</div>
<TabBar active={store.activeTab} onselect={goToTab} />

<LineupSheet />
<ScheduleSheet />
