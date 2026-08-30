<script>
  import TabBar from "./components/TabBar.svelte";
  import WeekView from "./views/WeekView.svelte";
  import LineupView from "./views/LineupView.svelte";
  import ScheduleView from "./views/ScheduleView.svelte";
  import PresenceView from "./views/PresenceView.svelte";
  import PlayersView from "./views/PlayersView.svelte";
  import AnalysisView from "./views/AnalysisView.svelte";
  import LineupSheet from "./print/LineupSheet.svelte";
  import ScheduleSheet from "./print/ScheduleSheet.svelte";
  import { ladeKader, loadWeek, refreshSpielplan } from "./lib/state.svelte.js";

  ladeKader();
  refreshSpielplan();
  loadWeek();

  const compMap = { anw: WeekView, auf: LineupView, plan: ScheduleView, pre: PresenceView, spl: PlayersView, ana: AnalysisView };

  let active = $state("anw");
  const Active = $derived(compMap[active]);

  function selectTab(id) {
    active = id;
    window.scrollTo(0, 0);
  }
</script>

<div class="app">
  <Active />
</div>
<TabBar active={active} onselect={selectTab} />

<LineupSheet />
<ScheduleSheet />
